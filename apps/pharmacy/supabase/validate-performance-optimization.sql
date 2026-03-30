-- ============================================================================
-- Performance Optimization Validation Script
-- 验证性能优化是否成功应用
-- ============================================================================

-- ============================================================================
-- 1. 检查 RLS 启用状态
-- ============================================================================

SELECT 
  '=== RLS 启用状态检查 ===' as check_type,
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ 已启用'
    ELSE '❌ 未启用'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'users', 'medicines', 'batches', 'inventory_transactions', 
    'system_settings', 'audit_logs', 'undoable_transactions', 
    'expired_medicine_actions'
  )
ORDER BY tablename;

-- ============================================================================
-- 2. 检查策略数量（应该减少重复策略）
-- ============================================================================

SELECT 
  '=== 策略数量检查 ===' as check_type,
  schemaname,
  tablename,
  COUNT(*) as policy_count,
  CASE 
    WHEN tablename = 'batches' AND COUNT(*) <= 4 THEN '✅ 策略已优化'
    WHEN tablename = 'users' AND COUNT(*) <= 4 THEN '✅ 策略已优化'
    WHEN tablename = 'audit_logs' AND COUNT(*) <= 1 THEN '✅ 策略已优化'
    WHEN tablename = 'undoable_transactions' AND COUNT(*) <= 2 THEN '✅ 策略已优化'
    WHEN tablename = 'expired_medicine_actions' AND COUNT(*) <= 3 THEN '✅ 策略已优化'
    ELSE '⚠️ 需要检查'
  END as optimization_status
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'medicines', 'batches', 'inventory_transactions', 
    'system_settings', 'audit_logs', 'undoable_transactions', 
    'expired_medicine_actions'
  )
GROUP BY schemaname, tablename
ORDER BY tablename;

-- ============================================================================
-- 3. 检查优化后的策略名称
-- ============================================================================

SELECT 
  '=== 优化策略名称检查 ===' as check_type,
  schemaname,
  tablename,
  policyname,
  cmd as command_type,
  CASE 
    WHEN policyname LIKE '%_policy' THEN '✅ 新优化策略'
    WHEN policyname LIKE '%_optimized' THEN '⚠️ 旧优化策略'
    ELSE '❓ 其他策略'
  END as policy_status
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'batches', 'audit_logs', 'undoable_transactions', 
    'expired_medicine_actions'
  )
ORDER BY tablename, policyname;

-- ============================================================================
-- 4. 检查是否存在问题策略（包含直接 auth.uid() 调用）
-- ============================================================================

SELECT 
  '=== 问题策略检查 ===' as check_type,
  schemaname,
  tablename,
  policyname,
  CASE 
    WHEN qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%' THEN '❌ 包含未优化的 auth.uid()'
    WHEN qual LIKE '%(select auth.uid())%' OR with_check LIKE '%(select auth.uid())%' THEN '✅ 已优化为子查询'
    ELSE '✅ 无直接 auth.uid() 调用'
  END as auth_optimization_status
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'batches', 'audit_logs', 'undoable_transactions', 
    'expired_medicine_actions'
  )
ORDER BY tablename, policyname;

-- ============================================================================
-- 5. 检查优化函数是否存在
-- ============================================================================

SELECT 
  '=== 优化函数检查 ===' as check_type,
  proname as function_name,
  CASE 
    WHEN proname IS NOT NULL THEN '✅ 函数存在'
    ELSE '❌ 函数缺失'
  END as function_status
FROM pg_proc 
WHERE proname IN (
  'is_authenticated_optimized',
  'get_current_user_role_optimized', 
  'is_admin_optimized',
  'is_admin_or_manager_optimized'
)
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

-- ============================================================================
-- 6. 性能测试查询（模拟实际使用场景）
-- ============================================================================

-- 6.1 测试用户查询性能
EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, name, email, role 
FROM public.users 
LIMIT 10;

-- 6.2 测试批次查询性能
EXPLAIN (ANALYZE, BUFFERS)
SELECT b.id, b.batch_number, b.quantity, m.name as medicine_name
FROM public.batches b
JOIN public.medicines m ON b.medicine_id = m.id
LIMIT 10;

-- 6.3 测试审计日志查询性能
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, table_name, operation, created_at
FROM public.audit_logs
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- 7. 安全性验证（确保权限控制仍然有效）
-- ============================================================================

-- 7.1 检查用户表权限
SELECT 
  '=== 用户表权限验证 ===' as check_type,
  policyname,
  cmd,
  roles,
  CASE 
    WHEN cmd = 'SELECT' AND (qual LIKE '%admin%' OR qual LIKE '%manager%' OR qual LIKE '%auth.uid%') THEN '✅ 查询权限正确'
    WHEN cmd = 'INSERT' AND qual LIKE '%admin%' THEN '✅ 插入权限正确'
    WHEN cmd = 'UPDATE' AND (qual LIKE '%admin%' OR qual LIKE '%auth.uid%') THEN '✅ 更新权限正确'
    WHEN cmd = 'DELETE' AND qual LIKE '%admin%' THEN '✅ 删除权限正确'
    ELSE '⚠️ 需要检查权限'
  END as permission_status
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY cmd, policyname;

-- 7.2 检查批次表权限
SELECT 
  '=== 批次表权限验证 ===' as check_type,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' AND qual LIKE '%auth.uid%' THEN '✅ 查询权限正确'
    WHEN cmd = 'INSERT' AND with_check LIKE '%auth.uid%' THEN '✅ 插入权限正确'
    WHEN cmd = 'UPDATE' AND (qual LIKE '%admin%' OR qual LIKE '%manager%') THEN '✅ 更新权限正确'
    WHEN cmd = 'DELETE' AND (qual LIKE '%admin%' OR qual LIKE '%manager%') THEN '✅ 删除权限正确'
    ELSE '⚠️ 需要检查权限'
  END as permission_status
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'batches'
ORDER BY cmd, policyname;

-- ============================================================================
-- 8. 总结报告
-- ============================================================================

DO $$
DECLARE
  total_policies INTEGER;
  optimized_policies INTEGER;
  problem_policies INTEGER;
  optimization_functions INTEGER;
BEGIN
  -- 统计策略数量
  SELECT COUNT(*) INTO total_policies
  FROM pg_policies 
  WHERE schemaname = 'public'
    AND tablename IN ('users', 'batches', 'audit_logs', 'undoable_transactions', 'expired_medicine_actions');
  
  -- 统计优化策略数量
  SELECT COUNT(*) INTO optimized_policies
  FROM pg_policies 
  WHERE schemaname = 'public'
    AND tablename IN ('users', 'batches', 'audit_logs', 'undoable_transactions', 'expired_medicine_actions')
    AND policyname LIKE '%_policy';
  
  -- 统计问题策略数量
  SELECT COUNT(*) INTO problem_policies
  FROM pg_policies 
  WHERE schemaname = 'public'
    AND tablename IN ('users', 'batches', 'audit_logs', 'undoable_transactions', 'expired_medicine_actions')
    AND (qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%');
  
  -- 统计优化函数数量
  SELECT COUNT(*) INTO optimization_functions
  FROM pg_proc 
  WHERE proname IN ('is_authenticated_optimized', 'get_current_user_role_optimized', 'is_admin_optimized', 'is_admin_or_manager_optimized')
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

  RAISE NOTICE '=================================================';
  RAISE NOTICE '性能优化验证报告';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '总策略数量: %', total_policies;
  RAISE NOTICE '优化策略数量: %', optimized_policies;
  RAISE NOTICE '问题策略数量: %', problem_policies;
  RAISE NOTICE '优化函数数量: %', optimization_functions;
  RAISE NOTICE '=================================================';
  
  IF problem_policies = 0 AND optimization_functions = 4 THEN
    RAISE NOTICE '✅ 性能优化成功完成！';
  ELSE
    RAISE NOTICE '⚠️ 发现问题，请检查上述查询结果';
  END IF;
  
  RAISE NOTICE '=================================================';
  RAISE NOTICE '建议：';
  RAISE NOTICE '1. 在 Supabase Dashboard 重新运行性能检查';
  RAISE NOTICE '2. 测试应用功能确保一切正常';
  RAISE NOTICE '3. 监控查询性能改进情况';
  RAISE NOTICE '=================================================';
END $$;
