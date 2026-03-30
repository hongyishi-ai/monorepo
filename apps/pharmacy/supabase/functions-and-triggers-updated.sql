-- DEPRECATED: This file contains legacy implementations kept for historical reference.
-- Do NOT execute in production. Authoritative versions are defined in:
--   supabase/migrations/2025-08-13_security_and_unify.sql
--   supabase/migrations/2025-08-13_unify_cleanup.sql
-- The authoritative functions use auth.uid() and stable error codes.

-- 药品出入库管理系统 - 数据库函数和触发器（更新版）
-- 基于实际数据库结构同步更新

-- ============================================================================
-- 1. 权限和认证相关函数
-- ============================================================================

-- 获取当前用户ID
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN (select auth.uid());
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO '';

-- 获取当前用户角色（优化版）
CREATE OR REPLACE FUNCTION public.get_current_user_role_optimized()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    (select auth.jwt() ->> 'role'),
    (select auth.jwt() -> 'app_metadata' ->> 'role'),
    'operator'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO '';

-- 检查是否为管理员（优化版）
CREATE OR REPLACE FUNCTION public.is_admin_optimized()
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

-- 检查是否为管理员或经理（优化版）
CREATE OR REPLACE FUNCTION public.is_admin_or_manager_optimized()
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

-- 检查用户权限
CREATE OR REPLACE FUNCTION public.check_user_role(required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get role from JWT user_metadata first
  user_role := (select auth.jwt() -> 'user_metadata' ->> 'role');
  
  -- Fallback to app_metadata
  IF user_role IS NULL THEN
    user_role := (select auth.jwt() -> 'app_metadata' ->> 'role');
  END IF;
  
  -- Final fallback to database
  IF user_role IS NULL THEN
    SELECT role INTO user_role 
    FROM public.users 
    WHERE id = current_user_id;
  END IF;
  
  IF user_role IS NULL THEN
    RETURN false;
  END IF;
  
  CASE required_role
    WHEN 'admin' THEN
      RETURN user_role = 'admin';
    WHEN 'manager' THEN
      RETURN user_role IN ('admin', 'manager');
    WHEN 'operator' THEN
      RETURN user_role IN ('admin', 'manager', 'operator');
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_catalog';
-- ============================================================================
-- 2. 药品和批次管理函数
-- ============================================================================

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
  -- 获取过期预警天数
  SELECT value::INTEGER INTO v_expiry_warning_days
  FROM public.system_settings
  WHERE key = 'expiry_warning_days';
  
  IF v_expiry_warning_days IS NULL THEN
    v_expiry_warning_days := 30; -- 默认30天
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

-- =========================================================================
-- 附加：按 FIFO 扣减多个批次的出库（允许人工绕过，提供标准实现）
-- =========================================================================
CREATE OR REPLACE FUNCTION public.perform_outbound_fifo(
  p_medicine_id UUID,
  p_total_quantity INTEGER,
  p_user_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_needed INTEGER := p_total_quantity;
  v_total_deducted INTEGER := 0;
  v_row RECORD;
  v_tx_id UUID;
BEGIN
  IF p_total_quantity <= 0 THEN
    RETURN json_build_object('success', false, 'error', '数量必须大于0');
  END IF;

  -- 仅检查用户存在（权限由 RLS 和触发器继续保障）
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
    RETURN json_build_object('success', false, 'error', '未找到用户，无法执行');
  END IF;

  FOR v_row IN
    SELECT id AS batch_id, quantity
    FROM public.batches
    WHERE medicine_id = p_medicine_id AND quantity > 0
    ORDER BY expiry_date ASC, production_date ASC
  LOOP
    EXIT WHEN v_needed <= 0;
    IF v_row.quantity <= 0 THEN
      CONTINUE;
    END IF;

    IF v_row.quantity >= v_needed THEN
      UPDATE public.batches
      SET quantity = quantity - v_needed, updated_at = NOW()
      WHERE id = v_row.batch_id
      RETURNING quantity INTO v_row.quantity;

      INSERT INTO public.inventory_transactions(
        medicine_id, batch_id, type, quantity, user_id, remaining_quantity, notes
      ) VALUES (
        p_medicine_id, v_row.batch_id, 'outbound', v_needed, p_user_id,
        v_row.quantity,
        COALESCE(p_notes, 'FIFO 自动出库')
      ) RETURNING id INTO v_tx_id;

      v_total_deducted := v_total_deducted + v_needed;
      v_needed := 0;
    ELSE
      UPDATE public.batches
      SET quantity = 0, updated_at = NOW()
      WHERE id = v_row.batch_id;

      INSERT INTO public.inventory_transactions(
        medicine_id, batch_id, type, quantity, user_id, remaining_quantity, notes
      ) VALUES (
        p_medicine_id, v_row.batch_id, 'outbound', v_row.quantity, p_user_id,
        0,
        COALESCE(p_notes, 'FIFO 自动出库')
      ) RETURNING id INTO v_tx_id;

      v_total_deducted := v_total_deducted + v_row.quantity;
      v_needed := v_needed - v_row.quantity;
    END IF;
  END LOOP;

  IF v_needed > 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', '库存不足，无法完成全部出库',
      'requested', p_total_quantity,
      'deducted', v_total_deducted,
      'remaining', v_needed
    );
  END IF;

  RETURN json_build_object('success', true, 'deducted', v_total_deducted);
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
    b.expiry_date ASC,  -- FIFO: earliest expiry first
    b.production_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_catalog';

-- 检查批次是否存在
CREATE OR REPLACE FUNCTION public.check_batch_exists(p_medicine_id UUID, p_batch_number TEXT)
RETURNS TABLE (
  batch_exists BOOLEAN,
  batch_id UUID,
  quantity INTEGER,
  production_date DATE,
  expiry_date DATE,
  batch_info JSONB
) AS $$
DECLARE
  v_batch RECORD;
BEGIN
  -- 查找现有批次
  SELECT 
    b.id,
    b.quantity,
    b.production_date,
    b.expiry_date,
    b.batch_number,
    m.name as medicine_name,
    m.barcode
  INTO v_batch
  FROM public.batches b
  JOIN public.medicines m ON b.medicine_id = m.id
  WHERE b.medicine_id = p_medicine_id 
    AND b.batch_number = p_batch_number;
  
  IF FOUND THEN
    RETURN QUERY SELECT 
      TRUE,
      v_batch.id,
      v_batch.quantity,
      v_batch.production_date::DATE,
      v_batch.expiry_date::DATE,
      jsonb_build_object(
        'batch_id', v_batch.id,
        'batch_number', v_batch.batch_number,
        'medicine_name', v_batch.medicine_name,
        'barcode', v_batch.barcode,
        'current_quantity', v_batch.quantity,
        'production_date', v_batch.production_date,
        'expiry_date', v_batch.expiry_date
      );
  ELSE
    RETURN QUERY SELECT 
      FALSE,
      NULL::UUID,
      0,
      NULL::DATE,
      NULL::DATE,
      NULL::JSONB;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_catalog';
-- ============================================================================
-- 3. 库存交易处理函数
-- ============================================================================

-- 处理库存交易
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
  v_batch RECORD;
  v_medicine RECORD;
  v_transaction_id UUID;
  v_new_quantity INTEGER;
BEGIN
  -- 验证输入参数
  IF p_quantity <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', '数量必须大于0'
    );
  END IF;
  
  IF p_type NOT IN ('inbound', 'outbound', 'adjustment', 'expired', 'damaged') THEN
    RETURN json_build_object(
      'success', false,
      'error', '无效的交易类型'
    );
  END IF;

  -- 权限校验：仅管理员或经理可执行 'adjustment'、'expired'、'damaged'
  IF p_type IN ('adjustment', 'expired', 'damaged') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.users WHERE id = p_user_id AND role IN ('admin','manager')
    ) THEN
      RETURN json_build_object('success', false, 'error', '权限不足，仅管理员或经理可执行该交易类型');
    END IF;
  END IF;
  
  -- 获取批次信息
  SELECT * INTO v_batch FROM public.batches WHERE id = p_batch_id;
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', '批次不存在'
    );
  END IF;
  
  -- 获取药品信息
  SELECT * INTO v_medicine FROM public.medicines WHERE id = p_medicine_id;
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', '药品不存在'
    );
  END IF;
  
  -- 过期校验：与前端一致（今天过期仍可操作），仅限制 inbound/outbound/adjustment
  IF v_batch.expiry_date < CURRENT_DATE AND p_type IN ('inbound', 'outbound', 'adjustment') THEN
    RETURN json_build_object(
      'success', false,
      'error', '批次已过期，无法进行库存操作'
    );
  END IF;
  
  -- 检查出库操作的库存是否足够
  IF p_type IN ('outbound', 'expired', 'damaged') THEN
    IF v_batch.quantity < p_quantity THEN
      RETURN json_build_object(
        'success', false,
        'error', '库存不足',
        'available_quantity', v_batch.quantity,
        'requested_quantity', p_quantity
      );
    END IF;
    v_new_quantity := v_batch.quantity - p_quantity;
  ELSE
    -- 入库或调整
    v_new_quantity := v_batch.quantity + p_quantity;
  END IF;
  
  -- 创建库存交易记录（补充 remaining_quantity）
  INSERT INTO public.inventory_transactions (
    medicine_id,
    batch_id,
    type,
    quantity,
    user_id,
    remaining_quantity,
    notes,
    reference_number
  ) VALUES (
    p_medicine_id,
    p_batch_id,
    p_type,
    p_quantity,
    p_user_id,
    v_new_quantity,
    p_notes,
    p_reference_number
  ) RETURNING id INTO v_transaction_id;
  
  -- 更新批次库存
  UPDATE public.batches 
  SET 
    quantity = v_new_quantity,
    updated_at = NOW()
  WHERE id = p_batch_id;
  
  RETURN json_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'previous_quantity', v_batch.quantity,
    'new_quantity', v_new_quantity,
    'medicine_name', v_medicine.name,
    'batch_number', v_batch.batch_number
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', '交易处理失败: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 添加批次数量（合并批次）
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
BEGIN
  -- 获取当前批次信息（使用完全限定名）
  SELECT quantity, medicine_id INTO v_current_quantity, v_medicine_id
  FROM public.batches
  WHERE id = p_batch_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, '批次不存在', 0, NULL::UUID;
    RETURN;
  END IF;
  
  -- 检查数量有效性
  IF p_additional_quantity <= 0 THEN
    RETURN QUERY SELECT FALSE, '入库数量必须大于0', v_current_quantity, NULL::UUID;
    RETURN;
  END IF;
  
  -- 计算新的总量
  v_new_quantity := v_current_quantity + p_additional_quantity;
  
  -- 更新批次数量（使用完全限定名）
  UPDATE public.batches
  SET quantity = v_new_quantity,
      updated_at = NOW()
  WHERE id = p_batch_id;
  
  -- 创建入库交易记录（使用完全限定名）
  INSERT INTO public.inventory_transactions (
    medicine_id,
    batch_id,
    user_id,
    type,
    quantity,
    remaining_quantity,
    notes
  ) VALUES (
    v_medicine_id,
    p_batch_id,
    p_user_id,
    'inbound',
    p_additional_quantity,
    v_new_quantity,
    COALESCE(p_notes, '批次合并入库')
  ) RETURNING id INTO v_transaction_id;
  
  RETURN QUERY SELECT 
    TRUE, 
    '批次库存合并成功', 
    v_new_quantity,
    v_transaction_id;
    
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT 
      FALSE, 
      '合并失败: ' || SQLERRM, 
      v_current_quantity,
      NULL::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ============================================================================
-- 4. 审计日志和撤回功能
-- ============================================================================

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
  -- 确保审计日志表存在
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs' AND table_schema = 'public') THEN
    RETURN uuid_generate_v4(); -- 返回一个假的ID，不影响主要功能
  END IF;

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
  -- 如果插入失败，返回一个假的ID，不影响主要功能
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
  -- 插入可撤回交易记录
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
  
  -- 通过统一过程执行入库以保证 remaining_quantity 正确写入并原子更新批次
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
  
  -- 标记为已撤回（当前表结构不包含 undo_transaction_id 列）
  UPDATE public.undoable_transactions 
  SET 
    is_undone = TRUE,
    undone_at = NOW(),
    undone_by = p_user_id
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
-- ============================================================================
-- 5. 触发器函数
-- ============================================================================

-- 库存交易处理触发器
CREATE OR REPLACE FUNCTION public.handle_inventory_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_medicine RECORD;
  v_batch RECORD;
  v_user RECORD;
  v_undoable_id UUID;
BEGIN
  -- 获取相关信息
  SELECT * INTO v_medicine FROM public.medicines WHERE id = NEW.medicine_id;
  SELECT * INTO v_batch FROM public.batches WHERE id = NEW.batch_id;
  SELECT * INTO v_user FROM public.users WHERE id = NEW.user_id;
  
  -- 注意：库存数量仅由数据库侧的过程函数（如 process_inventory_transaction）更新
  -- 此触发器只负责写入审计日志与撤回记录，不直接修改 batches 数量，避免重复更新
  
  -- 只有出库操作才创建可撤回记录
  IF NEW.type = 'outbound' THEN
    -- 使用SECURITY DEFINER函数创建可撤回记录
    SELECT public.insert_undoable_transaction(
      NEW.id,
      NEW.user_id,
      NEW.medicine_id,
      NEW.batch_id,
      NEW.quantity
    ) INTO v_undoable_id;
  END IF;
  
  -- 记录审计日志
  PERFORM public.log_audit_action(
    p_user_id => NEW.user_id,
    p_action_type => NEW.type || '_transaction',
    p_table_name => 'inventory_transactions',
    p_record_id => NEW.id,
    p_old_values => NULL,
    p_new_values => jsonb_build_object(
      'medicine_name', v_medicine.name,
      'batch_number', v_batch.batch_number,
      'type', NEW.type,
      'quantity', NEW.quantity,
      'user_name', v_user.name
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_catalog';

-- 药品变更审计触发器
CREATE OR REPLACE FUNCTION public.audit_medicines_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_action_type TEXT;
BEGIN
  -- 获取当前用户ID
  v_user_id := auth.uid();
  
  -- 如果没有认证用户，跳过审计
  IF v_user_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- 确定操作类型
  IF TG_OP = 'INSERT' THEN
    v_action_type := 'create_medicine';
    PERFORM public.log_audit_action(
      v_user_id,
      v_action_type,
      'medicines',
      NEW.id,
      NULL,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action_type := 'update_medicine';
    PERFORM public.log_audit_action(
      v_user_id,
      v_action_type,
      'medicines',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_action_type := 'delete_medicine';
    PERFORM public.log_audit_action(
      v_user_id,
      v_action_type,
      'medicines',
      OLD.id,
      to_jsonb(OLD),
      NULL
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_catalog';

-- 批次变更审计触发器
CREATE OR REPLACE FUNCTION public.audit_batches_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_action_type TEXT;
BEGIN
  -- 获取当前用户ID
  v_user_id := auth.uid();
  
  -- 如果没有认证用户，跳过审计
  IF v_user_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- 确定操作类型
  IF TG_OP = 'INSERT' THEN
    v_action_type := 'create_batch';
    PERFORM public.log_audit_action(
      v_user_id,
      v_action_type,
      'batches',
      NEW.id,
      NULL,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action_type := 'update_batch';
    PERFORM public.log_audit_action(
      v_user_id,
      v_action_type,
      'batches',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_action_type := 'delete_batch';
    PERFORM public.log_audit_action(
      v_user_id,
      v_action_type,
      'batches',
      OLD.id,
      to_jsonb(OLD),
      NULL
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_catalog';

-- ============================================================================
-- 6. 创建触发器
-- ============================================================================

-- 库存交易触发器
DROP TRIGGER IF EXISTS handle_inventory_transaction_trigger ON public.inventory_transactions;
CREATE TRIGGER handle_inventory_transaction_trigger
AFTER INSERT ON public.inventory_transactions
FOR EACH ROW EXECUTE FUNCTION public.handle_inventory_transaction();

-- 药品审计触发器
DROP TRIGGER IF EXISTS log_medicine_changes_trigger ON public.medicines;
CREATE TRIGGER log_medicine_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.medicines
FOR EACH ROW EXECUTE FUNCTION public.audit_medicines_changes();

-- 批次审计触发器
DROP TRIGGER IF EXISTS audit_batches_trigger ON public.batches;
CREATE TRIGGER audit_batches_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.batches
FOR EACH ROW EXECUTE FUNCTION public.audit_batches_changes();

-- ============================================================================
-- 7. 清理和维护函数
-- ============================================================================

-- 清理过期的可撤回交易
CREATE OR REPLACE FUNCTION public.cleanup_expired_undoable_transactions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- 删除过期的可撤回交易记录
  DELETE FROM public.undoable_transactions
  WHERE undo_deadline <= NOW()
    AND is_undone = FALSE;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_catalog';

-- 标记过期批次
CREATE OR REPLACE FUNCTION public.mark_expired_batches()
RETURNS TABLE (
  batch_id UUID,
  medicine_name TEXT,
  batch_number TEXT,
  expiry_date DATE,
  quantity INTEGER,
  days_expired INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    m.name,
    b.batch_number,
    b.expiry_date,
    b.quantity,
    (CURRENT_DATE - b.expiry_date)::INTEGER as days_expired
  FROM public.batches b
  JOIN public.medicines m ON b.medicine_id = m.id
  WHERE b.expiry_date < CURRENT_DATE
    AND b.quantity > 0
  ORDER BY b.expiry_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_catalog';