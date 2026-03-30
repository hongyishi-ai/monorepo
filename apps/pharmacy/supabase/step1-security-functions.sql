-- ============================================================================
-- 步骤 1: 创建安全权限检查函数
-- 在 Supabase SQL Editor 中执行此脚本
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

-- 验证安全函数创建
SELECT 
  routine_name, 
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('check_user_role', 'is_authenticated', 'get_user_role')
ORDER BY routine_name;
