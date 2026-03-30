-- ============================================================
-- 药品出入库管理系统 - 权威函数定义
-- 基于 2025-08-13_security_and_unify.sql
-- 包含所有经过验证的函数实现
-- ============================================================

-- ============================================================
-- 1. 权限和认证相关函数
-- ============================================================

-- 获取当前用户ID
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN (select auth.uid());
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO '';

-- 获取当前用户角色
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    (select auth.jwt() ->> 'role'),
    (select auth.jwt() -> 'app_metadata' ->> 'role'),
    'operator'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO '';

-- 检查是否为管理员
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := COALESCE(
    (select auth.jwt() ->> 'role'),
    (select auth.jwt() -> 'app_metadata' ->> 'role'),
    'operator'
  );
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO '';

-- 检查是否为管理员或经理
CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := COALESCE(
    (select auth.jwt() ->> 'role'),
    (select auth.jwt() -> 'app_metadata' ->> 'role'),
    'operator'
  );
  RETURN user_role IN ('admin', 'manager');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO '';

-- ============================================================
-- 2. 库存交易处理函数 (核心)
-- ============================================================

-- 并发安全的库存交易处理（原子更新 + 错误码支持）
CREATE OR REPLACE FUNCTION public.process_inventory_transaction(
  p_medicine_id UUID,
  p_batch_id UUID,
  p_type TEXT,
  p_quantity INTEGER,
  p_user_id UUID,                -- 兼容保留：函数内部使用 auth.uid()
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

  -- 角色与权限
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

  -- 原子条件更新批次库存
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

  -- 交易记录
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

-- ============================================================
-- 3. 批次管理函数
-- ============================================================

-- 首次入库单：创建批次 + 入库
CREATE OR REPLACE FUNCTION public.create_batch_and_inbound(
  p_medicine_id UUID,
  p_batch_number TEXT,
  p_production_date DATE,
  p_expiry_date DATE,
  p_quantity INTEGER,
  p_user_id UUID,             -- 兼容保留：函数内部使用 auth.uid()
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

  -- 创建批次或获取已有批次
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

  -- 执行入库
  v_tx_result := public.process_inventory_transaction(
    p_medicine_id => p_medicine_id,
    p_batch_id => v_batch_id,
    p_type => 'inbound',
    p_quantity => p_quantity,
    p_user_id => v_caller_user_id,
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

-- 合并批次数量
CREATE OR REPLACE FUNCTION public.add_batch_quantity(
  p_batch_id UUID,
  p_additional_quantity INTEGER,
  p_user_id UUID,              -- 兼容保留：函数内部使用 auth.uid()
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

-- 获取药品批次列表（FIFO排序）
CREATE OR REPLACE FUNCTION public.get_medicine_batches_fifo(medicine_id_param UUID)
RETURNS TABLE (
  batch_id UUID,
  batch_number TEXT,
  quantity INTEGER,
  expiry_date DATE,
  production_date DATE,
  days_until_expiry INTEGER,
  is_expired BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.batch_number,
    b.quantity,
    b.expiry_date,
    b.production_date,
    (b.expiry_date - CURRENT_DATE)::INTEGER as days_until_expiry,
    (b.expiry_date < CURRENT_DATE) as is_expired
  FROM public.batches b
  WHERE b.medicine_id = medicine_id_param
    AND b.quantity > 0
  ORDER BY
    b.expiry_date ASC,
    b.production_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_catalog';

-- ============================================================
-- 4. 撤回功能
-- ============================================================

-- 撤回出库交易
CREATE OR REPLACE FUNCTION public.undo_outbound_transaction(
  p_transaction_id UUID,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_undoable RECORD;
  v_transaction RECORD;
  v_batch RECORD;
  v_undo_transaction_id UUID;
  v_result JSON;
  v_new_batch_quantity INTEGER;
BEGIN
  -- 获取可撤回交易记录
  SELECT * INTO v_undoable
  FROM public.undoable_transactions
  WHERE transaction_id = p_transaction_id
    AND is_undone = FALSE
    AND undo_deadline > NOW();

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', '交易不可撤回或已过期'
    );
  END IF;

  -- 获取原始交易记录
  SELECT * INTO v_transaction
  FROM public.inventory_transactions
  WHERE id = p_transaction_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', '原始交易记录不存在'
    );
  END IF;

  -- 获取批次信息
  SELECT * INTO v_batch FROM public.batches WHERE id = v_transaction.batch_id;
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', '批次不存在'
    );
  END IF;

  -- 通过统一过程执行入库
  v_result := public.process_inventory_transaction(
    v_transaction.medicine_id,
    v_transaction.batch_id,
    'inbound',
    v_transaction.quantity,
    p_user_id,
    '撤回交易ID: ' || p_transaction_id,
    'UNDO_' || p_transaction_id::TEXT
  );

  IF COALESCE((v_result ->> 'success')::BOOLEAN, false) IS NOT TRUE THEN
    RETURN json_build_object(
      'success', false,
      'error', COALESCE(v_result ->> 'error', '撤回交易失败：入库处理失败')
    );
  END IF;

  v_undo_transaction_id := (v_result ->> 'transaction_id')::UUID;
  v_new_batch_quantity := (v_result ->> 'new_quantity')::INTEGER;

  -- 标记为已撤回
  UPDATE public.undoable_transactions
  SET
    is_undone = TRUE,
    undone_at = NOW(),
    undone_by = p_user_id,
    undo_transaction_id = v_undo_transaction_id
  WHERE id = v_undoable.id;

  RETURN json_build_object(
    'success', true,
    'undo_transaction_id', v_undo_transaction_id,
    'original_transaction_id', p_transaction_id,
    'restored_quantity', v_transaction.quantity,
    'new_batch_quantity', v_new_batch_quantity
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', '撤回交易失败: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_catalog';

-- 获取可撤回交易列表
CREATE OR REPLACE FUNCTION public.get_undoable_transactions(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  transaction_id UUID,
  user_id UUID,
  user_name TEXT,
  medicine_id UUID,
  medicine_name TEXT,
  batch_id UUID,
  batch_number TEXT,
  original_quantity INTEGER,
  undo_deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  time_remaining INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ut.id,
    ut.transaction_id,
    ut.user_id,
    u.name AS user_name,
    ut.medicine_id,
    m.name AS medicine_name,
    ut.batch_id,
    b.batch_number,
    ut.original_quantity,
    ut.undo_deadline,
    ut.created_at,
    (ut.undo_deadline - NOW()) AS time_remaining
  FROM
    public.undoable_transactions ut
    JOIN public.users u ON ut.user_id = u.id
    JOIN public.medicines m ON ut.medicine_id = m.id
    JOIN public.batches b ON ut.batch_id = b.id
  WHERE
    ut.is_undone = FALSE
    AND ut.undo_deadline > NOW()
    AND (p_user_id IS NULL OR ut.user_id = p_user_id)
  ORDER BY
    ut.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_catalog';

-- ============================================================
-- 5. 审计日志
-- ============================================================

-- 记录审计日志
CREATE OR REPLACE FUNCTION public.log_audit_action(
  p_user_id UUID,
  p_action_type TEXT,
  p_table_name TEXT,
  p_record_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action_type,
    table_name,
    record_id,
    old_values,
    new_values,
    created_at
  ) VALUES (
    p_user_id,
    p_action_type,
    p_table_name,
    p_record_id,
    p_old_values,
    p_new_values,
    NOW()
  ) RETURNING id INTO audit_id;

  RETURN audit_id;
EXCEPTION WHEN OTHERS THEN
  RETURN uuid_generate_v4();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 插入可撤回交易记录
CREATE OR REPLACE FUNCTION public.insert_undoable_transaction(
  p_transaction_id UUID,
  p_user_id UUID,
  p_medicine_id UUID,
  p_batch_id UUID,
  p_original_quantity INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_record_id UUID;
BEGIN
  INSERT INTO public.undoable_transactions (
    transaction_id,
    user_id,
    medicine_id,
    batch_id,
    original_quantity,
    undo_deadline
  ) VALUES (
    p_transaction_id,
    p_user_id,
    p_medicine_id,
    p_batch_id,
    p_original_quantity,
    NOW() + INTERVAL '24 hours'
  ) RETURNING id INTO v_record_id;

  RETURN v_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_catalog';

-- ============================================================
-- 6. 清理和维护
-- ============================================================

-- 清理过期的可撤回交易
CREATE OR REPLACE FUNCTION public.cleanup_expired_undoable_transactions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.undoable_transactions
  WHERE undo_deadline <= NOW()
    AND is_undone = FALSE;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_catalog';

-- 健康检查
CREATE OR REPLACE FUNCTION public.health_check()
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object('ok', true, 'now', NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_catalog';

-- 获取药品库存信息
CREATE OR REPLACE FUNCTION public.get_medicine_stock(medicine_id_param UUID)
RETURNS TABLE (
  medicine_id UUID,
  medicine_name TEXT,
  total_quantity INTEGER,
  available_quantity INTEGER,
  expired_quantity INTEGER,
  expiring_soon_quantity INTEGER,
  batch_count INTEGER,
  earliest_expiry_date DATE,
  latest_expiry_date DATE
) AS $$
DECLARE
  v_expiry_warning_days INTEGER;
BEGIN
  SELECT value::INTEGER INTO v_expiry_warning_days
  FROM public.system_settings
  WHERE key = 'expiry_warning_days';

  IF v_expiry_warning_days IS NULL THEN
    v_expiry_warning_days := 30;
  END IF;

  RETURN QUERY
  SELECT
    m.id,
    m.name,
    COALESCE(SUM(b.quantity), 0)::INTEGER as total_quantity,
    COALESCE(SUM(CASE WHEN b.expiry_date >= CURRENT_DATE THEN b.quantity ELSE 0 END), 0)::INTEGER as available_quantity,
    COALESCE(SUM(CASE WHEN b.expiry_date < CURRENT_DATE THEN b.quantity ELSE 0 END), 0)::INTEGER as expired_quantity,
    COALESCE(SUM(CASE WHEN b.expiry_date >= CURRENT_DATE AND b.expiry_date <= CURRENT_DATE + v_expiry_warning_days THEN b.quantity ELSE 0 END), 0)::INTEGER as expiring_soon_quantity,
    COUNT(DISTINCT b.id)::INTEGER as batch_count,
    MIN(b.expiry_date) as earliest_expiry_date,
    MAX(b.expiry_date) as latest_expiry_date
  FROM public.medicines m
  LEFT JOIN public.batches b ON m.id = b.medicine_id AND b.quantity > 0
  WHERE m.id = medicine_id_param
  GROUP BY m.id, m.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_catalog';
