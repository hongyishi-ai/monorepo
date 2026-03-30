-- ============================================================================
-- 步骤 2: 修复 RLS 策略
-- 在 Supabase SQL Editor 中执行此脚本
-- 注意：确保步骤1的安全函数已成功创建
-- ============================================================================

-- 2.1 修复用户表 RLS 策略
-- ============================================================================

-- 删除旧的不安全策略
DROP POLICY IF EXISTS "admin_full_access_users" ON public.users;
DROP POLICY IF EXISTS "manager_read_users" ON public.users;
DROP POLICY IF EXISTS "users_view_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;

-- 创建优化的安全策略
CREATE POLICY "admin_full_access_users" ON public.users
  FOR ALL TO authenticated
  USING (public.check_user_role('admin'))
  WITH CHECK (public.check_user_role('admin'));

CREATE POLICY "manager_read_users" ON public.users
  FOR SELECT TO authenticated
  USING (public.check_user_role('manager'));

CREATE POLICY "users_view_own" ON public.users
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK (
    (select auth.uid()) = id AND 
    role = (SELECT role FROM public.users WHERE id = (select auth.uid()))
  );

-- 2.2 修复药品表 RLS 策略
-- ============================================================================

-- 删除旧策略
DROP POLICY IF EXISTS "authenticated_read_medicines" ON public.medicines;
DROP POLICY IF EXISTS "admin_manager_manage_medicines" ON public.medicines;

-- 创建优化策略
CREATE POLICY "authenticated_read_medicines" ON public.medicines
  FOR SELECT TO authenticated
  USING (public.is_authenticated());

CREATE POLICY "admin_manager_manage_medicines" ON public.medicines
  FOR ALL TO authenticated
  USING (public.check_user_role('manager'))
  WITH CHECK (public.check_user_role('manager'));

-- 2.3 修复批次表 RLS 策略
-- ============================================================================

-- 删除旧策略
DROP POLICY IF EXISTS "authenticated_read_batches" ON public.batches;
DROP POLICY IF EXISTS "admin_manager_manage_batches" ON public.batches;
DROP POLICY IF EXISTS "operator_create_batches" ON public.batches;

-- 创建优化策略
CREATE POLICY "authenticated_read_batches" ON public.batches
  FOR SELECT TO authenticated
  USING (public.is_authenticated());

CREATE POLICY "admin_manager_manage_batches" ON public.batches
  FOR ALL TO authenticated
  USING (public.check_user_role('manager'))
  WITH CHECK (public.check_user_role('manager'));

CREATE POLICY "operator_create_batches" ON public.batches
  FOR INSERT TO authenticated
  WITH CHECK (public.is_authenticated());

-- 2.4 修复库存交易表 RLS 策略
-- ============================================================================

-- 删除旧策略
DROP POLICY IF EXISTS "authenticated_read_transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "authenticated_create_transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "admin_manager_manage_transactions" ON public.inventory_transactions;

-- 创建优化策略
CREATE POLICY "authenticated_read_transactions" ON public.inventory_transactions
  FOR SELECT TO authenticated
  USING (public.is_authenticated());

CREATE POLICY "authenticated_create_transactions" ON public.inventory_transactions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_authenticated());

CREATE POLICY "admin_manager_manage_transactions" ON public.inventory_transactions
  FOR UPDATE TO authenticated
  USING (public.check_user_role('manager'))
  WITH CHECK (public.check_user_role('manager'));

-- 2.5 修复系统设置表 RLS 策略
-- ============================================================================

-- 删除旧策略
DROP POLICY IF EXISTS "admin_manage_settings" ON public.system_settings;
DROP POLICY IF EXISTS "authenticated_read_settings" ON public.system_settings;

-- 创建优化策略
CREATE POLICY "admin_manage_settings" ON public.system_settings
  FOR ALL TO authenticated
  USING (public.check_user_role('admin'))
  WITH CHECK (public.check_user_role('admin'));

CREATE POLICY "authenticated_read_settings" ON public.system_settings
  FOR SELECT TO authenticated
  USING (public.is_authenticated());

-- 验证 RLS 策略
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'medicines', 'batches', 'inventory_transactions', 'system_settings')
ORDER BY tablename;

-- 验证策略数量
SELECT 
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;
