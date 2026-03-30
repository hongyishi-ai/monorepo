-- 统一清理与口径收口（非破坏性）
-- 目的：
-- 1) 再次声明权威函数实现，避免旧脚本覆盖后口径漂移
-- 2) 为关键函数添加 COMMENT 标注版本来源，便于审计
-- 3) 保持幂等执行，可在任意环境重复运行

-- 安全：DROP 仅用于可能残留的 BEFORE 触发器（已在早前迁移中删除；此处再次清理确保对齐）
DROP TRIGGER IF EXISTS update_inventory_on_transaction ON public.inventory_transactions;

-- 权威实现：process_inventory_transaction（使用 auth.uid()）
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
  v_caller_user_id UUID := auth.uid();
  v_caller_role TEXT;
BEGIN
  IF v_caller_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'code', 'UNAUTHENTICATED', 'error', '用户未认证');
  END IF;
  IF p_quantity <= 0 THEN
    RETURN json_build_object('success', false, 'code', 'INVALID_QUANTITY', 'error', '数量必须大于0');
  END IF;
  IF p_type NOT IN ('inbound', 'outbound', 'adjustment', 'expired', 'damaged') THEN
    RETURN json_build_object('success', false, 'code', 'INVALID_TYPE', 'error', '无效的交易类型');
  END IF;

  SELECT role INTO v_caller_role FROM public.users WHERE id = v_caller_user_id;
  IF p_type IN ('adjustment', 'expired', 'damaged') THEN
    IF v_caller_role NOT IN ('admin','manager') THEN
      RETURN json_build_object('success', false, 'code', 'FORBIDDEN', 'error', '权限不足，仅管理员或经理可执行该交易类型');
    END IF;
  END IF;

  SELECT * INTO v_medicine FROM public.medicines WHERE id = p_medicine_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'code', 'MEDICINE_NOT_FOUND', 'error', '药品不存在');
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

  INSERT INTO public.inventory_transactions (
    medicine_id, batch_id, type, quantity, user_id, remaining_quantity, notes, reference_number
  ) VALUES (
    p_medicine_id, p_batch_id, p_type, p_quantity, v_caller_user_id, v_new_quantity, p_notes, p_reference_number
  ) RETURNING id INTO v_transaction_id;

  RETURN json_build_object('success', true, 'code', 'OK', 'transaction_id', v_transaction_id, 'new_quantity', v_new_quantity, 'medicine_name', v_medicine.name);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'code', 'SERVER_ERROR', 'error', '交易处理失败: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_catalog';

COMMENT ON FUNCTION public.process_inventory_transaction(UUID, UUID, TEXT, INTEGER, UUID, TEXT, TEXT)
IS 'AUTHORITATIVE_VERSION=2025-08-13_security_and_unify; Uses auth.uid(); Atomic conditional update; Stable error codes';

-- 权威实现：create_batch_and_inbound（使用 auth.uid()）
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

  INSERT INTO public.batches(medicine_id, batch_number, production_date, expiry_date, quantity, created_at, updated_at)
  VALUES (p_medicine_id, p_batch_number, p_production_date, p_expiry_date, 0, NOW(), NOW())
  ON CONFLICT (medicine_id, batch_number) DO NOTHING
  RETURNING id INTO v_inserted_id;

  IF v_inserted_id IS NULL THEN
    SELECT id INTO v_batch_id FROM public.batches WHERE medicine_id = p_medicine_id AND batch_number = p_batch_number;
    RETURN json_build_object('success', false, 'code', 'BATCH_EXISTS', 'error', '批次已存在', 'batch_exists', true, 'batch_id', v_batch_id);
  ELSE
    v_batch_id := v_inserted_id;
    v_created_batch := TRUE;
  END IF;

  v_tx_result := public.process_inventory_transaction(p_medicine_id => p_medicine_id, p_batch_id => v_batch_id, p_type => 'inbound', p_quantity => p_quantity, p_user_id => v_caller_user_id, p_notes => p_notes, p_reference_number => NULL);

  IF COALESCE((v_tx_result ->> 'success')::BOOLEAN, FALSE) IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION USING MESSAGE = '入库失败: ' || (v_tx_result ->> 'error');
  END IF;

  RETURN json_build_object('success', true, 'code', 'OK', 'created_batch', v_created_batch, 'batch_id', v_batch_id, 'transaction_id', v_tx_result ->> 'transaction_id', 'new_quantity', (v_tx_result ->> 'new_quantity')::INT);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'code', 'SERVER_ERROR', 'error', '操作失败: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_catalog';

COMMENT ON FUNCTION public.create_batch_and_inbound(UUID, TEXT, DATE, DATE, INTEGER, UUID, TEXT)
IS 'AUTHORITATIVE_VERSION=2025-08-13_security_and_unify; Uses auth.uid(); Single-transaction create+inbound; Stable error codes';

-- 权威实现：add_batch_quantity（保持返回列一致，使用 auth.uid()）
CREATE OR REPLACE FUNCTION public.add_batch_quantity(
  p_batch_id UUID,
  p_additional_quantity INTEGER,
  p_user_id UUID,
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

  SELECT quantity, medicine_id INTO v_current_quantity, v_medicine_id FROM public.batches WHERE id = p_batch_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, '批次不存在', NULL::INTEGER, NULL::UUID; RETURN;
  END IF;

  UPDATE public.batches SET quantity = quantity + p_additional_quantity, updated_at = NOW() WHERE id = p_batch_id RETURNING quantity INTO v_new_quantity;

  INSERT INTO public.inventory_transactions(medicine_id, batch_id, type, quantity, user_id, remaining_quantity, notes)
  VALUES (v_medicine_id, p_batch_id, 'inbound', p_additional_quantity, v_caller_user_id, v_new_quantity, COALESCE(p_notes, '合并批次入库'))
  RETURNING id INTO v_transaction_id;

  RETURN QUERY SELECT true, '合并成功', v_new_quantity, v_transaction_id; RETURN;
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, '操作失败: ' || SQLERRM, NULL::INTEGER, NULL::UUID; RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_catalog';

COMMENT ON FUNCTION public.add_batch_quantity(UUID, INTEGER, UUID, TEXT)
IS 'AUTHORITATIVE_VERSION=2025-08-13_security_and_unify; Uses auth.uid(); Merges quantity with stable 4-column return type';


