-- DEPRECATED: Legacy batch merge helpers for reference only.
-- Do NOT execute in production. Authoritative implementation lives in:
--   supabase/migrations/2025-08-13_security_and_unify.sql
--   supabase/migrations/2025-08-13_unify_cleanup.sql
-- Functions now rely on auth.uid() and stable 4-column return for add_batch_quantity.

-- 批次合并功能（更新版）
-- 基于实际 Supabase 数据库同步更新

-- ============================================================================
-- 1. 批次合并主函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.merge_batches(
  p_source_batch_id UUID,
  p_target_batch_id UUID,
  p_user_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_source_batch RECORD;
  v_target_batch RECORD;
  v_transaction_id UUID;
BEGIN
  -- 获取源批次信息
  SELECT * INTO v_source_batch FROM public.batches WHERE id = p_source_batch_id;
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', '源批次不存在'
    );
  END IF;
  
  -- 获取目标批次信息
  SELECT * INTO v_target_batch FROM public.batches WHERE id = p_target_batch_id;
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', '目标批次不存在'
    );
  END IF;
  
  -- 验证批次属于同一药品
  IF v_source_batch.medicine_id != v_target_batch.medicine_id THEN
    RETURN json_build_object(
      'success', false,
      'error', '不能合并不同药品的批次'
    );
  END IF;
  
  -- 验证源批次有库存
  IF v_source_batch.quantity <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', '源批次没有库存可合并'
    );
  END IF;
  
  -- 创建合并交易记录
  INSERT INTO public.inventory_transactions (
    medicine_id,
    batch_id,
    type,
    quantity,
    user_id,
    notes,
    reference_number
  ) VALUES (
    v_source_batch.medicine_id,
    p_target_batch_id,
    'adjustment',
    v_source_batch.quantity,
    p_user_id,
    COALESCE(p_notes, '') || ' [批次合并: ' || v_source_batch.batch_number || ' -> ' || v_target_batch.batch_number || ']',
    'MERGE_' || p_source_batch_id::TEXT
  ) RETURNING id INTO v_transaction_id;
  
  -- 更新目标批次库存
  UPDATE public.batches 
  SET 
    quantity = quantity + v_source_batch.quantity,
    updated_at = NOW()
  WHERE id = p_target_batch_id;
  
  -- 清空源批次库存
  UPDATE public.batches 
  SET 
    quantity = 0,
    updated_at = NOW()
  WHERE id = p_source_batch_id;
  
  RETURN json_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'merged_quantity', v_source_batch.quantity,
    'source_batch', v_source_batch.batch_number,
    'target_batch', v_target_batch.batch_number,
    'new_target_quantity', v_target_batch.quantity + v_source_batch.quantity
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', '批次合并失败: ' || SQLERRM
    );
END;
$function$;

-- ============================================================================
-- 2. 批次数量增加函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.add_batch_quantity(
  p_batch_id UUID,
  p_additional_quantity INTEGER,
  p_user_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  new_quantity INTEGER,
  transaction_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
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
$function$;

-- ============================================================================
-- 3. 批次合并验证函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_batch_merge(
  p_source_batch_id UUID,
  p_target_batch_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_source_batch RECORD;
  v_target_batch RECORD;
  v_validation_result JSON;
BEGIN
  -- 获取源批次信息
  SELECT 
    b.*,
    m.name as medicine_name,
    m.barcode
  INTO v_source_batch 
  FROM public.batches b
  JOIN public.medicines m ON b.medicine_id = m.id
  WHERE b.id = p_source_batch_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'valid', false,
      'error', '源批次不存在'
    );
  END IF;
  
  -- 获取目标批次信息
  SELECT 
    b.*,
    m.name as medicine_name,
    m.barcode
  INTO v_target_batch 
  FROM public.batches b
  JOIN public.medicines m ON b.medicine_id = m.id
  WHERE b.id = p_target_batch_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'valid', false,
      'error', '目标批次不存在'
    );
  END IF;
  
  -- 验证批次属于同一药品
  IF v_source_batch.medicine_id != v_target_batch.medicine_id THEN
    RETURN json_build_object(
      'valid', false,
      'error', '不能合并不同药品的批次',
      'source_medicine', v_source_batch.medicine_name,
      'target_medicine', v_target_batch.medicine_name
    );
  END IF;
  
  -- 验证源批次有库存
  IF v_source_batch.quantity <= 0 THEN
    RETURN json_build_object(
      'valid', false,
      'error', '源批次没有库存可合并',
      'source_quantity', v_source_batch.quantity
    );
  END IF;
  
  -- 检查有效期差异警告
  v_validation_result := json_build_object(
    'valid', true,
    'source_batch', json_build_object(
      'id', v_source_batch.id,
      'batch_number', v_source_batch.batch_number,
      'quantity', v_source_batch.quantity,
      'expiry_date', v_source_batch.expiry_date,
      'medicine_name', v_source_batch.medicine_name
    ),
    'target_batch', json_build_object(
      'id', v_target_batch.id,
      'batch_number', v_target_batch.batch_number,
      'quantity', v_target_batch.quantity,
      'expiry_date', v_target_batch.expiry_date,
      'medicine_name', v_target_batch.medicine_name
    ),
    'merged_quantity', v_source_batch.quantity + v_target_batch.quantity
  );
  
  -- 添加有效期差异警告
  IF ABS(v_source_batch.expiry_date - v_target_batch.expiry_date) > 30 THEN
    v_validation_result := v_validation_result || json_build_object(
      'warning', '批次有效期相差超过30天，请确认是否继续合并',
      'expiry_difference_days', ABS(v_source_batch.expiry_date - v_target_batch.expiry_date)
    );
  END IF;
  
  RETURN v_validation_result;
END;
$function$;

-- ============================================================================
-- 4. 获取可合并批次列表
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_mergeable_batches(
  p_medicine_id UUID
)
RETURNS TABLE(
  batch_id UUID,
  batch_number TEXT,
  quantity INTEGER,
  production_date DATE,
  expiry_date DATE,
  days_until_expiry INTEGER,
  is_expired BOOLEAN,
  can_be_source BOOLEAN,
  can_be_target BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.batch_number,
    b.quantity,
    b.production_date,
    b.expiry_date,
    (b.expiry_date - CURRENT_DATE)::INTEGER as days_until_expiry,
    (b.expiry_date < CURRENT_DATE) as is_expired,
    (b.quantity > 0) as can_be_source,  -- 有库存才能作为源批次
    TRUE as can_be_target  -- 所有批次都可以作为目标批次
  FROM public.batches b
  WHERE b.medicine_id = p_medicine_id
  ORDER BY 
    b.expiry_date ASC,  -- 按有效期排序
    b.production_date ASC;
END;
$function$;

-- ============================================================================
-- 5. 批次合并历史查询
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_batch_merge_history(
  p_medicine_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
  transaction_id UUID,
  medicine_name TEXT,
  target_batch_number TEXT,
  merged_quantity INTEGER,
  operator_name TEXT,
  merge_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  reference_number TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    it.id,
    m.name,
    b.batch_number,
    it.quantity,
    u.name,
    it.created_at,
    it.notes,
    it.reference_number
  FROM public.inventory_transactions it
  JOIN public.medicines m ON it.medicine_id = m.id
  JOIN public.batches b ON it.batch_id = b.id
  JOIN public.users u ON it.user_id = u.id
  WHERE it.type = 'adjustment'
    AND it.reference_number LIKE 'MERGE_%'
    AND (p_medicine_id IS NULL OR it.medicine_id = p_medicine_id)
  ORDER BY it.created_at DESC
  LIMIT p_limit;
END;
$function$;

-- ============================================================================
-- 6. 创建批次合并相关的索引（如果不存在）
-- ============================================================================

-- 为批次合并查询优化索引
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_reference_number 
ON public.inventory_transactions(reference_number) 
WHERE reference_number LIKE 'MERGE_%';

-- 为批次查询优化索引
CREATE INDEX IF NOT EXISTS idx_batches_medicine_expiry 
ON public.batches(medicine_id, expiry_date, quantity) 
WHERE quantity > 0;

-- ============================================================================
-- 7. 批次合并权限检查
-- ============================================================================

-- 创建批次合并权限检查函数
CREATE OR REPLACE FUNCTION public.can_merge_batches()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- 只有管理员和经理可以合并批次
  RETURN public.is_admin_or_manager_optimized();
END;
$function$;

-- ============================================================================
-- 8. 批次合并审计触发器
-- ============================================================================

-- 为批次合并操作添加审计日志
CREATE OR REPLACE FUNCTION public.audit_batch_merge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_user_id UUID;
BEGIN
  -- 获取当前用户ID
  v_user_id := auth.uid();
  
  -- 如果是批次合并操作，记录审计日志
  IF NEW.type = 'adjustment' AND NEW.reference_number LIKE 'MERGE_%' THEN
    PERFORM public.log_audit_action(
      v_user_id,
      'batch_merge',
      'inventory_transactions',
      NEW.id,
      NULL,
      jsonb_build_object(
        'source_batch_id', SUBSTRING(NEW.reference_number FROM 7)::UUID,
        'target_batch_id', NEW.batch_id,
        'merged_quantity', NEW.quantity,
        'notes', NEW.notes
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 创建触发器（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'trigger_audit_batch_merge'
  ) THEN
    CREATE TRIGGER trigger_audit_batch_merge
      AFTER INSERT ON public.inventory_transactions
      FOR EACH ROW
      EXECUTE FUNCTION public.audit_batch_merge();
  END IF;
END $$;

-- ============================================================================
-- 9. 批次合并统计函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_batch_merge_stats(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'total_merges', COUNT(*),
    'total_merged_quantity', SUM(quantity),
    'unique_medicines', COUNT(DISTINCT medicine_id),
    'average_merge_quantity', ROUND(AVG(quantity), 2),
    'merge_by_user', json_agg(
      json_build_object(
        'user_name', u.name,
        'merge_count', user_stats.merge_count,
        'total_quantity', user_stats.total_quantity
      )
    )
  ) INTO v_stats
  FROM (
    SELECT 
      it.user_id,
      COUNT(*) as merge_count,
      SUM(it.quantity) as total_quantity
    FROM public.inventory_transactions it
    WHERE it.type = 'adjustment'
      AND it.reference_number LIKE 'MERGE_%'
      AND it.created_at::DATE BETWEEN p_start_date AND p_end_date
    GROUP BY it.user_id
  ) user_stats
  JOIN public.users u ON user_stats.user_id = u.id;
  
  RETURN COALESCE(v_stats, json_build_object(
    'total_merges', 0,
    'total_merged_quantity', 0,
    'unique_medicines', 0,
    'average_merge_quantity', 0,
    'merge_by_user', '[]'::json
  ));
END;
$function$;

-- ============================================================================
-- 10. 批次合并测试函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.test_batch_merge_functions()
RETURNS TABLE(
  test_name TEXT,
  status TEXT,
  details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- 测试1: 检查函数是否存在
  RETURN QUERY
  SELECT 
    'function_exists_check'::TEXT,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' 
          AND routine_name IN ('merge_batches', 'add_batch_quantity', 'validate_batch_merge')
      ) THEN 'PASS'::TEXT
      ELSE 'FAIL'::TEXT
    END,
    'Checking if batch merge functions exist'::TEXT;
  
  -- 测试2: 检查权限函数
  RETURN QUERY
  SELECT 
    'permission_function_check'::TEXT,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' 
          AND routine_name = 'can_merge_batches'
      ) THEN 'PASS'::TEXT
      ELSE 'FAIL'::TEXT
    END,
    'Checking if batch merge permission function exists'::TEXT;
  
  -- 测试3: 检查索引
  RETURN QUERY
  SELECT 
    'index_check'::TEXT,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
          AND indexname = 'idx_inventory_transactions_reference_number'
      ) THEN 'PASS'::TEXT
      ELSE 'FAIL'::TEXT
    END,
    'Checking if batch merge indexes exist'::TEXT;
END;
$function$;