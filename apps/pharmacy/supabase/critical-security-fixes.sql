-- ============================================================================
-- 关键安全问题修复 SQL 脚本
-- 修复 RLS 策略、权限验证和数据库索引等关键安全问题
-- ============================================================================

-- 1. 创建安全权限检查函数
-- ============================================================================

-- 创建安全的权限检查函数
CREATE OR REPLACE FUNCTION public.check_user_role(required_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  -- 从JWT获取角色信息
  user_role := (select auth.jwt() ->> 'role');
  
  -- 如果JWT中没有角色信息，从app_metadata获取
  IF user_role IS NULL THEN
    user_role := (select auth.jwt() -> 'app_metadata' ->> 'role');
  END IF;
  
  -- 如果还是没有，从数据库获取
  IF user_role IS NULL THEN
    SELECT role INTO user_role 
    FROM public.users 
    WHERE id = (select auth.uid());
  END IF;
  
  -- 检查权限层级
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
$$;

-- 创建用户认证检查函数
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (select auth.uid()) IS NOT NULL;
END;
$$;

-- 创建用户权限获取函数
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  -- 优先从JWT获取
  user_role := (select auth.jwt() ->> 'role');
  
  -- 从app_metadata获取
  IF user_role IS NULL THEN
    user_role := (select auth.jwt() -> 'app_metadata' ->> 'role');
  END IF;
  
  -- 备用从数据库获取
  IF user_role IS NULL THEN
    SELECT role INTO user_role 
    FROM public.users 
    WHERE id = (select auth.uid());
  END IF;
  
  RETURN COALESCE(user_role, 'operator');
END;
$$;

-- 2. 修复用户表 RLS 策略
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

-- 3. 修复药品表 RLS 策略
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

-- 4. 修复批次表 RLS 策略
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

-- 5. 修复库存交易表 RLS 策略
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

-- 6. 添加性能索引
-- ============================================================================

-- 用户表索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON public.users USING btree (role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON public.users USING btree (email);

-- 药品表索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medicines_barcode ON public.medicines USING btree (barcode);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medicines_name ON public.medicines USING btree (name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medicines_manufacturer ON public.medicines USING btree (manufacturer);

-- 批次表索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_batches_medicine_id ON public.batches USING btree (medicine_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_batches_expiry_date ON public.batches USING btree (expiry_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_batches_batch_number ON public.batches USING btree (batch_number);

-- 库存交易表索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_transactions_medicine_id ON public.inventory_transactions USING btree (medicine_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_transactions_batch_id ON public.inventory_transactions USING btree (batch_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_transactions_user_id ON public.inventory_transactions USING btree (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_transactions_created_at ON public.inventory_transactions USING btree (created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_transactions_type ON public.inventory_transactions USING btree (type);

-- 7. 系统设置表 RLS 策略优化
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

-- ============================================================================
-- 修复完成
-- ============================================================================

-- 验证 RLS 是否启用
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

-- 验证索引创建
SELECT 
  schemaname, 
  tablename, 
  indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 验证安全函数
SELECT 
  routine_name, 
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('check_user_role', 'is_authenticated', 'get_user_role')
ORDER BY routine_name;
