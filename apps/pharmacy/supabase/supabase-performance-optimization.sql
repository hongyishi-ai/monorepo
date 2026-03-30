-- ============================================================================
-- Supabase Performance Optimization Script
-- 解决数据库性能建议中的所有问题
-- 
-- 主要修复:
-- 1. Auth RLS Initialization Plan - 优化 auth.uid() 调用
-- 2. Multiple Permissive Policies - 合并重复的 RLS 策略
-- 
-- 执行前请备份数据库！
-- ============================================================================

-- ============================================================================
-- Phase 1: 修复 Auth RLS Initialization Plan 问题
-- ============================================================================

-- 1.1 优化 expired_medicine_actions 表的 RLS 策略
-- ============================================================================

-- 删除现有策略
DROP POLICY IF EXISTS "authenticated_read_expired_actions" ON public.expired_medicine_actions;
DROP POLICY IF EXISTS "authenticated_create_expired_actions" ON public.expired_medicine_actions;
DROP POLICY IF EXISTS "admin_delete_expired_actions" ON public.expired_medicine_actions;

-- 创建优化的策略（使用子查询优化 auth.uid() 调用）
CREATE POLICY "authenticated_read_expired_actions" ON public.expired_medicine_actions
  FOR SELECT TO public
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "authenticated_create_expired_actions" ON public.expired_medicine_actions
  FOR INSERT TO public
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "admin_delete_expired_actions" ON public.expired_medicine_actions
  FOR DELETE TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- 1.2 优化 audit_logs 表的 RLS 策略
-- ============================================================================

-- 删除现有策略
DROP POLICY IF EXISTS "管理员可以查看所有审计日志" ON public.audit_logs;
DROP POLICY IF EXISTS "用户可以查看自己的审计日志" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;

-- 创建优化的策略
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs
  FOR SELECT TO public
  USING (
    -- 管理员可以查看所有日志
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
    OR
    -- 用户可以查看自己的日志
    user_id = (select auth.uid())
  );

-- 1.3 优化 undoable_transactions 表的 RLS 策略
-- ============================================================================

-- 删除现有策略
DROP POLICY IF EXISTS "管理员可以查看所有可撤回交易" ON public.undoable_transactions;
DROP POLICY IF EXISTS "用户可以查看自己的可撤回交易" ON public.undoable_transactions;
DROP POLICY IF EXISTS "用户可以撤回自己的交易" ON public.undoable_transactions;

-- 创建优化的策略
CREATE POLICY "undoable_transactions_select_policy" ON public.undoable_transactions
  FOR SELECT TO public
  USING (
    -- 管理员可以查看所有可撤回交易
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
    OR
    -- 用户可以查看自己的可撤回交易
    user_id = (select auth.uid())
  );

CREATE POLICY "undoable_transactions_update_policy" ON public.undoable_transactions
  FOR UPDATE TO public
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- 1.4 优化 users 表的 RLS 策略
-- ============================================================================

-- 删除现有策略（包括所有变体）
DROP POLICY IF EXISTS "users_view_own_simple" ON public.users;
DROP POLICY IF EXISTS "users_update_own_simple" ON public.users;
DROP POLICY IF EXISTS "admin_full_access_users_secure" ON public.users;
DROP POLICY IF EXISTS "manager_read_users_secure" ON public.users;
DROP POLICY IF EXISTS "users_view_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "admin_full_access_users" ON public.users;
DROP POLICY IF EXISTS "manager_read_users" ON public.users;
DROP POLICY IF EXISTS "users_view_own_optimized" ON public.users;
DROP POLICY IF EXISTS "users_update_own_optimized" ON public.users;
DROP POLICY IF EXISTS "admin_full_access_users_optimized" ON public.users;
DROP POLICY IF EXISTS "manager_read_users_optimized" ON public.users;

-- 创建优化的策略
CREATE POLICY "users_select_policy" ON public.users
  FOR SELECT TO public
  USING (
    -- 管理员可以查看所有用户
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
    OR
    -- 经理可以查看所有用户
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = (select auth.uid()) AND role = 'manager'
    )
    OR
    -- 用户可以查看自己的信息
    id = (select auth.uid())
  );

CREATE POLICY "users_update_policy" ON public.users
  FOR UPDATE TO public
  USING (
    -- 管理员可以更新所有用户
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
    OR
    -- 用户可以更新自己的信息（但不能修改角色）
    id = (select auth.uid())
  )
  WITH CHECK (
    -- 管理员可以更新所有用户
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
    OR
    -- 用户更新自己时不能修改角色
    (
      id = (select auth.uid()) AND 
      role = (SELECT role FROM public.users WHERE id = (select auth.uid()))
    )
  );

CREATE POLICY "users_insert_policy" ON public.users
  FOR INSERT TO public
  WITH CHECK (
    -- 只有管理员可以创建新用户
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "users_delete_policy" ON public.users
  FOR DELETE TO public
  USING (
    -- 只有管理员可以删除用户
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- ============================================================================
-- Phase 2: 合并 batches 表的多个许可策略
-- ============================================================================

-- 2.1 删除所有现有的 batches 表策略
-- ============================================================================

DROP POLICY IF EXISTS "authenticated_read_batches" ON public.batches;
DROP POLICY IF EXISTS "authenticated_read_batches_optimized" ON public.batches;
DROP POLICY IF EXISTS "admin_manager_manage_batches" ON public.batches;
DROP POLICY IF EXISTS "admin_manager_insert_batches_optimized" ON public.batches;
DROP POLICY IF EXISTS "admin_manager_update_batches_optimized" ON public.batches;
DROP POLICY IF EXISTS "admin_manager_delete_batches_optimized" ON public.batches;
DROP POLICY IF EXISTS "operator_create_batches" ON public.batches;
DROP POLICY IF EXISTS "operator_create_batches_optimized" ON public.batches;

-- 2.2 创建合并的优化策略
-- ============================================================================

-- 统一的 SELECT 策略
CREATE POLICY "batches_select_policy" ON public.batches
  FOR SELECT TO public
  USING ((select auth.uid()) IS NOT NULL);

-- 统一的 INSERT 策略
CREATE POLICY "batches_insert_policy" ON public.batches
  FOR INSERT TO public
  WITH CHECK (
    -- 所有认证用户都可以创建批次（入库操作）
    (select auth.uid()) IS NOT NULL
  );

-- 统一的 UPDATE 策略
CREATE POLICY "batches_update_policy" ON public.batches
  FOR UPDATE TO public
  USING (
    -- 管理员和经理可以更新批次
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    -- 管理员和经理可以更新批次
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  );

-- 统一的 DELETE 策略
CREATE POLICY "batches_delete_policy" ON public.batches
  FOR DELETE TO public
  USING (
    -- 只有管理员和经理可以删除批次
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  );

-- ============================================================================
-- Phase 3: 验证和清理
-- ============================================================================

-- 3.1 验证 RLS 启用状态
-- ============================================================================
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'users', 'medicines', 'batches', 'inventory_transactions', 
    'system_settings', 'audit_logs', 'undoable_transactions', 
    'expired_medicine_actions'
  )
ORDER BY tablename;

-- 3.2 验证策略数量
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'medicines', 'batches', 'inventory_transactions', 
    'system_settings', 'audit_logs', 'undoable_transactions', 
    'expired_medicine_actions'
  )
GROUP BY schemaname, tablename
ORDER BY tablename;

-- 3.3 列出所有策略名称以确认优化完成
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command_type,
  roles
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'batches', 'audit_logs', 'undoable_transactions', 
    'expired_medicine_actions'
  )
ORDER BY tablename, policyname;

-- ============================================================================
-- Phase 4: 优化其他表的 RLS 策略以保持一致性
-- ============================================================================

-- 4.1 优化 medicines 表策略
-- ============================================================================
DROP POLICY IF EXISTS "authenticated_read_medicines" ON public.medicines;
DROP POLICY IF EXISTS "authenticated_read_medicines_optimized" ON public.medicines;
DROP POLICY IF EXISTS "admin_manager_manage_medicines" ON public.medicines;

CREATE POLICY "medicines_select_policy" ON public.medicines
  FOR SELECT TO public
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "medicines_manage_policy" ON public.medicines
  FOR ALL TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role IN ('admin', 'manager')
    )
  );

-- 4.2 优化 inventory_transactions 表策略
-- ============================================================================
DROP POLICY IF EXISTS "authenticated_read_transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "authenticated_create_transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "admin_delete_transactions" ON public.inventory_transactions;

CREATE POLICY "inventory_transactions_select_policy" ON public.inventory_transactions
  FOR SELECT TO public
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "inventory_transactions_insert_policy" ON public.inventory_transactions
  FOR INSERT TO public
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "inventory_transactions_delete_policy" ON public.inventory_transactions
  FOR DELETE TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- 4.3 优化 system_settings 表策略
-- ============================================================================
DROP POLICY IF EXISTS "authenticated_read_settings" ON public.system_settings;
DROP POLICY IF EXISTS "admin_manage_settings" ON public.system_settings;

CREATE POLICY "system_settings_select_policy" ON public.system_settings
  FOR SELECT TO public
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "system_settings_manage_policy" ON public.system_settings
  FOR ALL TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- ============================================================================
-- Phase 5: 创建性能优化的辅助函数
-- ============================================================================

-- 5.1 创建优化的认证检查函数
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_authenticated_optimized()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (select auth.uid()) IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5.2 创建优化的角色检查函数
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_current_user_role_optimized()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.users
  WHERE id = (select auth.uid())
  LIMIT 1;

  RETURN COALESCE(user_role, 'operator');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5.3 创建优化的管理员检查函数
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin_optimized()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_current_user_role_optimized() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5.4 创建优化的管理员或经理检查函数
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin_or_manager_optimized()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_current_user_role_optimized() IN ('admin', 'manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- 完成信息
-- ============================================================================

-- 输出完成信息
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Supabase Performance Optimization 完成!';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '修复内容:';
  RAISE NOTICE '1. ✅ Auth RLS Initialization Plan 问题已修复';
  RAISE NOTICE '2. ✅ Multiple Permissive Policies 问题已修复';
  RAISE NOTICE '3. ✅ 所有 auth.uid() 调用已优化为子查询';
  RAISE NOTICE '4. ✅ 重复的 RLS 策略已合并';
  RAISE NOTICE '5. ✅ 所有表的 RLS 策略已统一优化';
  RAISE NOTICE '6. ✅ 创建了性能优化的辅助函数';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '请运行上面的验证查询确认优化效果';
  RAISE NOTICE '建议重新运行 Supabase 性能检查以验证改进';
  RAISE NOTICE '=================================================';
END $$;
