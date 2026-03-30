-- 药品出入库管理系统 - 行级安全策略 (RLS)
-- 根据用户角色 (admin, manager, operator) 配置数据访问权限
-- 更新时间: 2025-07-21

-- ============================================================================
-- 清理现有策略
-- ============================================================================

-- 删除所有现有策略
DROP POLICY IF EXISTS "authenticated_users_only" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_only" ON public.medicines;
DROP POLICY IF EXISTS "authenticated_users_only" ON public.batches;
DROP POLICY IF EXISTS "authenticated_users_only" ON public.inventory_transactions;
DROP POLICY IF EXISTS "authenticated_users_only" ON public.system_settings;

-- 删除旧版本策略
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "users_view_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "admin_full_access_users" ON public.users;
DROP POLICY IF EXISTS "manager_read_users" ON public.users;

DROP POLICY IF EXISTS "All authenticated users can view medicines" ON public.medicines;
DROP POLICY IF EXISTS "Admins and managers can insert medicines" ON public.medicines;
DROP POLICY IF EXISTS "Admins and managers can update medicines" ON public.medicines;
DROP POLICY IF EXISTS "authenticated_read_medicines" ON public.medicines;
DROP POLICY IF EXISTS "admin_manager_manage_medicines" ON public.medicines;

DROP POLICY IF EXISTS "All authenticated users can view batches" ON public.batches;
DROP POLICY IF EXISTS "All authenticated users can insert batches" ON public.batches;
DROP POLICY IF EXISTS "All authenticated users can update batches" ON public.batches;
DROP POLICY IF EXISTS "authenticated_read_batches" ON public.batches;
DROP POLICY IF EXISTS "admin_manager_manage_batches" ON public.batches;
DROP POLICY IF EXISTS "operator_create_batches" ON public.batches;

DROP POLICY IF EXISTS "All authenticated users can view inventory transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "All authenticated users can insert inventory transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "authenticated_read_transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "authenticated_create_transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "admin_delete_transactions" ON public.inventory_transactions;

DROP POLICY IF EXISTS "All authenticated users can view system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can insert system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can update system settings" ON public.system_settings;
DROP POLICY IF EXISTS "authenticated_read_settings" ON public.system_settings;
DROP POLICY IF EXISTS "admin_manage_settings" ON public.system_settings;

-- ============================================================================
-- 权限检查函数
-- ============================================================================

-- 获取当前用户角色 (改进版本，处理用户记录不存在的情况)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
  current_user_id UUID;
BEGIN
  -- 获取当前认证用户ID
  current_user_id := auth.uid();

  -- 如果没有认证用户，返回NULL
  IF current_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 尝试获取用户角色，如果用户记录不存在则返回NULL
  SELECT role INTO user_role
  FROM public.users
  WHERE id = current_user_id;

  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 检查是否为管理员
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_current_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 检查是否为管理员或经理
CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_current_user_role() IN ('admin', 'manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 检查是否为认证用户
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 用户表 (users) RLS 策略
-- ============================================================================

-- 启用 RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 管理员可以查看和管理所有用户
CREATE POLICY "admin_full_access_users" ON public.users
  FOR ALL TO public
  USING (is_admin())
  WITH CHECK (is_admin());

-- 经理可以查看所有用户但不能修改
CREATE POLICY "manager_read_users" ON public.users
  FOR SELECT TO public
  USING (get_current_user_role() = 'manager');

-- 用户可以查看自己的信息
CREATE POLICY "users_view_own" ON public.users
  FOR SELECT TO public
  USING (id = auth.uid());

-- 用户可以更新自己的基本信息（除了角色）
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO public
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.users WHERE id = auth.uid()));

-- ============================================================================
-- 药品表 (medicines) RLS 策略
-- ============================================================================

-- 启用 RLS
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;

-- 所有认证用户可以查看药品
CREATE POLICY "authenticated_read_medicines" ON public.medicines
  FOR SELECT TO public
  USING (is_authenticated());

-- 管理员和经理可以管理药品
CREATE POLICY "admin_manager_manage_medicines" ON public.medicines
  FOR INSERT, UPDATE, DELETE TO public
  USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());

-- ============================================================================
-- 批次表 (batches) RLS 策略
-- ============================================================================

-- 启用 RLS
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

-- 所有认证用户可以查看批次
CREATE POLICY "authenticated_read_batches" ON public.batches
  FOR SELECT TO public
  USING (is_authenticated());

-- 管理员和经理可以管理批次
CREATE POLICY "admin_manager_manage_batches" ON public.batches
  FOR INSERT, UPDATE, DELETE TO public
  USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());

-- 操作员可以创建批次（入库操作）
CREATE POLICY "operator_create_batches" ON public.batches
  FOR INSERT TO public
  WITH CHECK (is_authenticated());

-- ============================================================================
-- 库存交易表 (inventory_transactions) RLS 策略
-- ============================================================================

-- 启用 RLS
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- 所有认证用户可以查看库存交易
CREATE POLICY "authenticated_read_transactions" ON public.inventory_transactions
  FOR SELECT TO public
  USING (is_authenticated());

-- 所有认证用户可以创建库存交易
CREATE POLICY "authenticated_create_transactions" ON public.inventory_transactions
  FOR INSERT TO public
  WITH CHECK (is_authenticated());

-- 只有管理员可以删除库存交易记录
CREATE POLICY "admin_delete_transactions" ON public.inventory_transactions
  FOR DELETE TO public
  USING (is_admin());

-- ============================================================================
-- 系统设置表 (system_settings) RLS 策略
-- ============================================================================

-- 启用 RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 所有认证用户可以查看系统设置
CREATE POLICY "authenticated_read_settings" ON public.system_settings
  FOR SELECT TO public
  USING (is_authenticated());

-- 只有管理员可以管理系统设置
CREATE POLICY "admin_manage_settings" ON public.system_settings
  FOR INSERT, UPDATE, DELETE TO public
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- 测试和验证函数
-- ============================================================================

-- 验证 RLS 是否正确启用
CREATE OR REPLACE FUNCTION public.verify_rls_enabled()
RETURNS TABLE(table_name TEXT, rls_enabled BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::TEXT,
    t.rowsecurity
  FROM pg_tables t
  WHERE t.schemaname = 'public'
    AND t.tablename IN ('users', 'medicines', 'batches', 'inventory_transactions', 'system_settings')
  ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 验证策略数量
CREATE OR REPLACE FUNCTION public.verify_policy_count()
RETURNS TABLE(table_name TEXT, policy_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.tablename::TEXT,
    COUNT(*)
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.tablename IN ('users', 'medicines', 'batches', 'inventory_transactions', 'system_settings')
  GROUP BY p.tablename
  ORDER BY p.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 测试 RLS 策略的完整性
CREATE OR REPLACE FUNCTION public.test_rls_policies()
RETURNS TABLE(test_name TEXT, result TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'RLS Enabled Check'::TEXT,
    CASE 
      WHEN (SELECT COUNT(*) FROM verify_rls_enabled() WHERE rls_enabled = false) = 0 
      THEN 'PASS'::TEXT 
      ELSE 'FAIL'::TEXT 
    END;
  
  RETURN QUERY
  SELECT 
    'Policy Count Check'::TEXT,
    CASE 
      WHEN (SELECT COUNT(*) FROM verify_policy_count()) = 5 
      THEN 'PASS'::TEXT 
      ELSE 'FAIL'::TEXT 
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
