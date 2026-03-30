-- 首次入库单 RPC：原子化创建批次并入库
-- 语义：仅在批次不存在时创建批次，然后在同一事务中完成入库
-- 若批次已存在，则返回提示信息，由前端走“合并库存”流程

CREATE OR REPLACE FUNCTION public.create_batch_and_inbound(
  p_medicine_id UUID,
  p_batch_number TEXT,
  p_production_date DATE,
  p_expiry_date DATE,
  p_quantity INTEGER,
  p_user_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_medicine RECORD;
  v_batch_id UUID;
  v_created_batch BOOLEAN := FALSE;
  v_inserted_id UUID;
  v_tx_result JSON;
BEGIN
  -- 基本校验
  IF p_quantity <= 0 THEN
    RETURN json_build_object('success', false, 'error', '数量必须大于0');
  END IF;

  IF p_production_date > CURRENT_DATE THEN
    RETURN json_build_object('success', false, 'error', '生产日期不能晚于当前日期');
  END IF;

  IF p_production_date >= p_expiry_date THEN
    RETURN json_build_object('success', false, 'error', '生产日期不能晚于或等于有效期');
  END IF;

  -- 药品存在性校验
  SELECT * INTO v_medicine FROM public.medicines WHERE id = p_medicine_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', '药品不存在');
  END IF;

  -- 尝试创建批次（唯一约束：medicine_id + batch_number）
  INSERT INTO public.batches(
    medicine_id, batch_number, production_date, expiry_date, quantity, created_at, updated_at
  ) VALUES (
    p_medicine_id, p_batch_number, p_production_date, p_expiry_date, 0, NOW(), NOW()
  ) ON CONFLICT (medicine_id, batch_number) DO NOTHING
  RETURNING id INTO v_inserted_id;

  IF v_inserted_id IS NULL THEN
    -- 批次已存在，返回提示信息，由前端选择“合并库存”
    SELECT id INTO v_batch_id
    FROM public.batches
    WHERE medicine_id = p_medicine_id AND batch_number = p_batch_number;

    RETURN json_build_object(
      'success', false,
      'error', '批次已存在',
      'batch_exists', true,
      'batch_id', v_batch_id
    );
  ELSE
    v_batch_id := v_inserted_id;
    v_created_batch := TRUE;
  END IF;

  -- 在同一事务内完成入库（原子化）
  v_tx_result := public.process_inventory_transaction(
    p_medicine_id => p_medicine_id,
    p_batch_id => v_batch_id,
    p_type => 'inbound',
    p_quantity => p_quantity,
    p_user_id => p_user_id,
    p_notes => p_notes,
    p_reference_number => NULL
  );

  IF COALESCE((v_tx_result ->> 'success')::BOOLEAN, FALSE) IS DISTINCT FROM TRUE THEN
    -- 入库失败，回滚整个函数调用（事务级函数会随异常回滚）
    RAISE EXCEPTION USING MESSAGE = '入库失败: ' || (v_tx_result ->> 'error');
  END IF;

  RETURN json_build_object(
    'success', true,
    'created_batch', v_created_batch,
    'batch_id', v_batch_id,
    'transaction_id', v_tx_result ->> 'transaction_id',
    'new_quantity', (v_tx_result ->> 'new_quantity')::INT
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', '操作失败: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_catalog';


