-- 审计日志和撤回操作功能（更新版）
-- 基于实际数据库结构同步更新

-- ============================================================================
-- 1. 审计日志相关函数
-- ============================================================================

-- 记录审计日志的函数
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

-- ============================================================================
-- 2. 可撤回交易相关函数
-- ============================================================================

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
-- 3. 获取可撤回的出库交易（兼容旧版本）
-- ============================================================================

-- 获取可撤回的出库交易
CREATE OR REPLACE FUNCTION public.get_reversible_outbound_transactions(
  p_user_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  transaction_id UUID,
  medicine_name TEXT,
  batch_number TEXT,
  quantity INTEGER,
  unit TEXT,
  operator_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  hours_since_transaction NUMERIC,
  can_reverse BOOLEAN,
  notes TEXT
) AS $$
DECLARE
  v_time_limit INTERVAL := INTERVAL '24 hours';
BEGIN
  RETURN QUERY
  SELECT 
    it.id as transaction_id,
    m.name as medicine_name,
    b.batch_number,
    it.quantity,
    m.unit as unit,
    u.name as operator_name,
    it.created_at,
    EXTRACT(EPOCH FROM (NOW() - it.created_at)) / 3600 as hours_since_transaction,
    (it.created_at > NOW() - v_time_limit 
     AND it.notes NOT LIKE '%[已撤回%'
     AND NOT EXISTS (
       SELECT 1 FROM public.inventory_transactions it2
       WHERE it2.notes LIKE '%撤回交易ID: ' || it.id || '%'
     )) as can_reverse,
    it.notes
  FROM public.inventory_transactions it
  JOIN public.medicines m ON it.medicine_id = m.id
  JOIN public.batches b ON it.batch_id = b.id
  JOIN public.users u ON it.user_id = u.id
  WHERE it.type = 'outbound'
    AND (p_user_id IS NULL OR it.user_id = p_user_id)
  ORDER BY it.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_catalog';

-- 兼容函数 reverse_outbound_transaction 已废弃，统一使用 undo_outbound_transaction。

-- ============================================================================
-- 4. 清理和维护函数
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
  
  -- 注意：不再在这里更新批次数量，因为前端已经通过remaining_quantity计算了正确的库存
  -- 前端会直接更新batches表，避免重复更新
  
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