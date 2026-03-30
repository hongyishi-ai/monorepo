-- 并发安全的库存交易处理与触发器清理（部署于生产时执行）

-- 1) 防御性移除可能存在的 BEFORE 触发器，避免二次更新库存
DROP TRIGGER IF EXISTS update_inventory_on_transaction ON public.inventory_transactions;

-- 2) 并发安全的库存交易处理函数（原子更新）
CREATE OR REPLACE FUNCTION public.process_inventory_transaction(
  p_medicine_id UUID,
  p_batch_id UUID,
  p_type TEXT,
  p_quantity INTEGER,
  p_user_id UUID,
  p_notes TEXT DEFAULT NULL,
  p_reference_number TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_medicine RECORD;
  v_new_quantity INTEGER;
  v_transaction_id UUID;
BEGIN
  IF p_quantity <= 0 THEN
    RETURN json_build_object('success', false, 'error', '数量必须大于0');
  END IF;
  IF p_type NOT IN ('inbound', 'outbound', 'adjustment', 'expired', 'damaged') THEN
    RETURN json_build_object('success', false, 'error', '无效的交易类型');
  END IF;

  IF p_type IN ('adjustment', 'expired', 'damaged') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.users WHERE id = p_user_id AND role IN ('admin','manager')
    ) THEN
      RETURN json_build_object('success', false, 'error', '权限不足，仅管理员或经理可执行该交易类型');
    END IF;
  END IF;

  SELECT * INTO v_medicine FROM public.medicines WHERE id = p_medicine_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', '药品不存在');
  END IF;

  IF p_type IN ('outbound', 'expired', 'damaged') THEN
    UPDATE public.batches
    SET quantity = quantity - p_quantity,
        updated_at = NOW()
    WHERE id = p_batch_id
      AND medicine_id = p_medicine_id
      AND quantity >= p_quantity
      AND expiry_date > CURRENT_DATE
    RETURNING quantity INTO v_new_quantity;

    IF v_new_quantity IS NULL THEN
      RETURN json_build_object('success', false, 'error', '库存不足或批次不可用');
    END IF;
  ELSE
    UPDATE public.batches
    SET quantity = quantity + p_quantity,
        updated_at = NOW()
    WHERE id = p_batch_id AND medicine_id = p_medicine_id
    RETURNING quantity INTO v_new_quantity;

    IF v_new_quantity IS NULL THEN
      RETURN json_build_object('success', false, 'error', '批次不存在');
    END IF;
  END IF;

  INSERT INTO public.inventory_transactions (
    medicine_id, batch_id, type, quantity, user_id, remaining_quantity, notes, reference_number
  ) VALUES (
    p_medicine_id, p_batch_id, p_type, p_quantity, p_user_id, v_new_quantity, p_notes, p_reference_number
  ) RETURNING id INTO v_transaction_id;

  RETURN json_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'new_quantity', v_new_quantity,
    'medicine_name', v_medicine.name
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', '交易处理失败: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


