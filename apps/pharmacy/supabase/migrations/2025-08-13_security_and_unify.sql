-- 安全与口径统一（非破坏性）：改用 auth.uid() 防伪，保留原参数签名；统一并发安全的原子更新实现
-- 注意：所有函数保持原有入参（如 p_user_id）以保证前端兼容，但在函数内部一律忽略该参数，改用 auth.uid()

-- 1) 并发安全的库存交易处理（权限内聚 + 原子条件更新）
CREATE OR REPLACE FUNCTION public.process_inventory_transaction(
  p_medicine_id UUID,
  p_batch_id UUID,
  p_type TEXT,
  p_quantity INTEGER,
  p_user_id UUID,                -- 兼容保留：已在函数内部忽略，统一使用 auth.uid()
  p_notes TEXT DEFAULT NULL,
  p_reference_number TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_medicine RECORD;
  v_new_quantity INTEGER;
  v_transaction_id UUID;
  v_caller_user_id UUID := auth.uid();
  v_caller_role TEXT;
BEGIN
  -- 认证校验
  IF v_caller_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'code', 'UNAUTHENTICATED', 'error', '用户未认证');
  END IF;

  -- 基本校验
  IF p_quantity <= 0 THEN
    RETURN json_build_object('success', false, 'code', 'INVALID_QUANTITY', 'error', '数量必须大于0');
  END IF;
  IF p_type NOT IN ('inbound', 'outbound', 'adjustment', 'expired', 'damaged') THEN
    RETURN json_build_object('success', false, 'code', 'INVALID_TYPE', 'error', '无效的交易类型');
  END IF;

  -- 角色与权限（仅对特定类型收紧权限）
  SELECT role INTO v_caller_role FROM public.users WHERE id = v_caller_user_id;
  IF p_type IN ('adjustment', 'expired', 'damaged') THEN
    IF v_caller_role NOT IN ('admin','manager') THEN
      RETURN json_build_object('success', false, 'code', 'FORBIDDEN', 'error', '权限不足，仅管理员或经理可执行该交易类型');
    END IF;
  END IF;

  -- 药品存在性
  SELECT * INTO v_medicine FROM public.medicines WHERE id = p_medicine_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'code', 'MEDICINE_NOT_FOUND', 'error', '药品不存在');
  END IF;

  -- 原子条件更新批次库存（出库含到期校验；保持历史口径：expiry_date > CURRENT_DATE）
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
      RETURN json_build_object('success', false, 'code', 'INSUFFICIENT_STOCK', 'error', '库存不足或批次不可用');
    END IF;
  ELSE
    UPDATE public.batches
    SET quantity = quantity + p_quantity,
        updated_at = NOW()
    WHERE id = p_batch_id AND medicine_id = p_medicine_id
    RETURNING quantity INTO v_new_quantity;

    IF v_new_quantity IS NULL THEN
      RETURN json_build_object('success', false, 'code', 'BATCH_NOT_FOUND', 'error', '批次不存在');
    END IF;
  END IF;

  -- 交易记录（统一写入真实调用者）
  INSERT INTO public.inventory_transactions (
    medicine_id, batch_id, type, quantity, user_id, remaining_quantity, notes, reference_number
  ) VALUES (
    p_medicine_id, p_batch_id, p_type, p_quantity, v_caller_user_id, v_new_quantity, p_notes, p_reference_number
  ) RETURNING id INTO v_transaction_id;

  RETURN json_build_object(
    'success', true,
    'code', 'OK',
    'transaction_id', v_transaction_id,
    'new_quantity', v_new_quantity,
    'medicine_name', v_medicine.name
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'code', 'SERVER_ERROR', 'error', '交易处理失败: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_catalog';


-- 2) 首次入库单：创建批次 + 入库（事务内调用，使用 auth.uid()）
CREATE OR REPLACE FUNCTION public.create_batch_and_inbound(
  p_medicine_id UUID,
  p_batch_number TEXT,
  p_production_date DATE,
  p_expiry_date DATE,
  p_quantity INTEGER,
  p_user_id UUID,             -- 兼容保留：已在函数内部忽略
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_medicine RECORD;
  v_batch_id UUID;
  v_created_batch BOOLEAN := FALSE;
  v_inserted_id UUID;
  v_tx_result JSON;
  v_caller_user_id UUID := auth.uid();
BEGIN
  IF v_caller_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'code', 'UNAUTHENTICATED', 'error', '用户未认证');
  END IF;

  IF p_quantity <= 0 THEN
    RETURN json_build_object('success', false, 'code', 'INVALID_QUANTITY', 'error', '数量必须大于0');
  END IF;
  IF p_production_date > CURRENT_DATE THEN
    RETURN json_build_object('success', false, 'code', 'INVALID_PRODUCTION_DATE', 'error', '生产日期不能晚于当前日期');
  END IF;
  IF p_production_date >= p_expiry_date THEN
    RETURN json_build_object('success', false, 'code', 'INVALID_EXPIRY_RANGE', 'error', '生产日期不能晚于或等于有效期');
  END IF;

  SELECT * INTO v_medicine FROM public.medicines WHERE id = p_medicine_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'code', 'MEDICINE_NOT_FOUND', 'error', '药品不存在');
  END IF;

  INSERT INTO public.batches(
    medicine_id, batch_number, production_date, expiry_date, quantity, created_at, updated_at
  ) VALUES (
    p_medicine_id, p_batch_number, p_production_date, p_expiry_date, 0, NOW(), NOW()
  ) ON CONFLICT (medicine_id, batch_number) DO NOTHING
  RETURNING id INTO v_inserted_id;

  IF v_inserted_id IS NULL THEN
    SELECT id INTO v_batch_id
    FROM public.batches
    WHERE medicine_id = p_medicine_id AND batch_number = p_batch_number;

    RETURN json_build_object(
      'success', false,
      'code', 'BATCH_EXISTS',
      'error', '批次已存在',
      'batch_exists', true,
      'batch_id', v_batch_id
    );
  ELSE
    v_batch_id := v_inserted_id;
    v_created_batch := TRUE;
  END IF;

  v_tx_result := public.process_inventory_transaction(
    p_medicine_id => p_medicine_id,
    p_batch_id => v_batch_id,
    p_type => 'inbound',
    p_quantity => p_quantity,
    p_user_id => v_caller_user_id,   -- 兼容保留：实际在被调函数内会再次忽略
    p_notes => p_notes,
    p_reference_number => NULL
  );

  IF COALESCE((v_tx_result ->> 'success')::BOOLEAN, FALSE) IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION USING MESSAGE = '入库失败: ' || (v_tx_result ->> 'error');
  END IF;

  RETURN json_build_object(
    'success', true,
    'code', 'OK',
    'created_batch', v_created_batch,
    'batch_id', v_batch_id,
    'transaction_id', v_tx_result ->> 'transaction_id',
    'new_quantity', (v_tx_result ->> 'new_quantity')::INT
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'code', 'SERVER_ERROR', 'error', '操作失败: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_catalog';


-- 3) 合并批次数量：统一使用调用者身份，保持历史允许范围（操作员亦可），最小化破坏性
CREATE OR REPLACE FUNCTION public.add_batch_quantity(
  p_batch_id UUID,
  p_additional_quantity INTEGER,
  p_user_id UUID,              -- 兼容保留：已在函数内部忽略
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  new_quantity INTEGER,
  transaction_id UUID
) AS $$
DECLARE
  v_current_quantity INTEGER;
  v_new_quantity INTEGER;
  v_medicine_id UUID;
  v_transaction_id UUID;
  v_caller_user_id UUID := auth.uid();
BEGIN
  IF v_caller_user_id IS NULL THEN
    RETURN QUERY SELECT false, '用户未认证', NULL::INTEGER, NULL::UUID; RETURN;
  END IF;
  IF p_additional_quantity <= 0 THEN
    RETURN QUERY SELECT false, '数量必须大于0', NULL::INTEGER, NULL::UUID; RETURN;
  END IF;

  SELECT quantity, medicine_id INTO v_current_quantity, v_medicine_id
  FROM public.batches WHERE id = p_batch_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, '批次不存在', NULL::INTEGER, NULL::UUID; RETURN;
  END IF;

  UPDATE public.batches
  SET quantity = quantity + p_additional_quantity, updated_at = NOW()
  WHERE id = p_batch_id
  RETURNING quantity INTO v_new_quantity;

  INSERT INTO public.inventory_transactions(
    medicine_id, batch_id, type, quantity, user_id, remaining_quantity, notes
  ) VALUES (
    v_medicine_id, p_batch_id, 'inbound', p_additional_quantity, v_caller_user_id, v_new_quantity, COALESCE(p_notes, '合并批次入库')
  ) RETURNING id INTO v_transaction_id;

  RETURN QUERY SELECT true, '合并成功', v_new_quantity, v_transaction_id; RETURN;
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, '操作失败: ' || SQLERRM, NULL::INTEGER, NULL::UUID; RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_catalog';


-- 4) 健康检查保持不变（便于前端与运维连通性检测）
CREATE OR REPLACE FUNCTION public.health_check()
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object('ok', true, 'now', NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_catalog';


