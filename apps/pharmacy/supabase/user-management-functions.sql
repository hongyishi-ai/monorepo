-- 用户管理功能
-- 基于实际 Supabase 数据库同步更新

-- ============================================================================
-- 1. 完整用户创建函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_user_complete(
  user_email TEXT,
  user_password TEXT,
  user_name TEXT,
  user_role TEXT DEFAULT 'operator'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  new_user_id UUID;
  auth_user_data JSON;
  public_user_data JSON;
  result JSON;
BEGIN
  -- 验证参数
  IF user_email IS NULL OR user_email = '' THEN
    RETURN json_build_object('success', false, 'error', '邮箱不能为空');
  END IF;
  
  IF user_password IS NULL OR length(user_password) < 6 THEN
    RETURN json_build_object('success', false, 'error', '密码长度不能少于6位');
  END IF;
  
  IF user_role NOT IN ('admin', 'manager', 'operator') THEN
    RETURN json_build_object('success', false, 'error', '无效的用户角色');
  END IF;
  
  -- 检查邮箱是否已存在
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    RETURN json_build_object('success', false, 'error', '邮箱地址已存在');
  END IF;
  
  -- 生成新的 UUID
  new_user_id := gen_random_uuid();
  
  -- 在 auth.users 中创建用户
  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at, 
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data
  ) VALUES (
    new_user_id,
    user_email,
    crypt(user_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    json_build_object('role', user_role),
    json_build_object('name', user_name)
  );
  
  -- 在 public.users 中创建用户
  INSERT INTO public.users (
    id, email, name, role, created_at, updated_at
  ) VALUES (
    new_user_id,
    user_email,
    user_name,
    user_role,
    now(),
    now()
  );
  
  -- 返回成功结果
  RETURN json_build_object(
    'success', true,
    'user_id', new_user_id,
    'email', user_email,
    'name', user_name,
    'role', user_role,
    'message', '用户创建成功'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false, 
      'error', '创建用户失败: ' || SQLERRM
    );
END;
$function$;

-- ============================================================================
-- 2. 重置用户密码函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reset_user_password(
  user_email TEXT,
  new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  target_user_id UUID;
BEGIN
  -- 验证参数
  IF user_email IS NULL OR user_email = '' THEN
    RETURN json_build_object('success', false, 'error', '邮箱不能为空');
  END IF;
  
  IF new_password IS NULL OR length(new_password) < 6 THEN
    RETURN json_build_object('success', false, 'error', '密码长度不能少于6位');
  END IF;
  
  -- 查找用户
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', '用户不存在');
  END IF;
  
  -- 更新密码
  UPDATE auth.users 
  SET 
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = target_user_id;
  
  -- 返回成功结果
  RETURN json_build_object(
    'success', true,
    'user_id', target_user_id,
    'email', user_email,
    'message', '密码重置成功'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false, 
      'error', '密码重置失败: ' || SQLERRM
    );
END;
$function$;

-- ============================================================================
-- 3. 用户数据同步函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_user_metadata_to_jwt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  user_metadata jsonb;
BEGIN
  user_metadata := jsonb_build_object(
    'name', NEW.name,
    'role', NEW.role,
    'email', NEW.email,
    'updated_at', NEW.updated_at
  );

  UPDATE auth.users 
  SET raw_user_meta_data = user_metadata
  WHERE id = NEW.id;

  RETURN NEW;
END;
$function$;

-- 创建触发器（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'trigger_sync_user_metadata_to_jwt'
  ) THEN
    CREATE TRIGGER trigger_sync_user_metadata_to_jwt
      AFTER UPDATE ON public.users
      FOR EACH ROW
      EXECUTE FUNCTION public.sync_user_metadata_to_jwt();
  END IF;
END $$;

-- ============================================================================
-- 4. 新用户处理函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN 
  INSERT INTO public.users (id, email, name, role, is_active, last_login) 
  VALUES ( 
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 
    COALESCE(NEW.raw_user_meta_data->>'role', 'operator'), 
    true, 
    NOW() 
  ) 
  ON CONFLICT (id) DO UPDATE SET 
    email = NEW.email, 
    name = COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 
    role = COALESCE(NEW.raw_user_meta_data->>'role', EXCLUDED.role), 
    last_login = NOW(), 
    updated_at = NOW(); 
  
  RETURN NEW; 
END;
$function$;

-- 创建触发器（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- ============================================================================
-- 5. 用户数据一致性检查和修复
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_user_data_consistency()
RETURNS TABLE(
  issue_type TEXT,
  auth_user_id UUID,
  public_user_id UUID,
  auth_email TEXT,
  public_email TEXT,
  description TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- 检查在 auth.users 中存在但在 public.users 中缺失的用户
  RETURN QUERY
  SELECT 
    'missing_in_public'::TEXT,
    au.id,
    NULL::UUID,
    au.email,
    NULL::TEXT,
    '在 auth.users 中存在但在 public.users 中缺失'::TEXT
  FROM auth.users au
  LEFT JOIN public.users pu ON au.id = pu.id
  WHERE pu.id IS NULL;
  
  -- 检查在 public.users 中存在但在 auth.users 中缺失的用户
  RETURN QUERY
  SELECT 
    'missing_in_auth'::TEXT,
    NULL::UUID,
    pu.id,
    NULL::TEXT,
    pu.email,
    '在 public.users 中存在但在 auth.users 中缺失'::TEXT
  FROM public.users pu
  LEFT JOIN auth.users au ON pu.id = au.id
  WHERE au.id IS NULL;
  
  -- 检查邮箱地址不一致的用户
  RETURN QUERY
  SELECT 
    'email_mismatch'::TEXT,
    au.id,
    pu.id,
    au.email,
    pu.email,
    '邮箱地址不一致'::TEXT
  FROM auth.users au
  JOIN public.users pu ON au.id = pu.id
  WHERE au.email != pu.email;
END;
$function$;

-- ============================================================================
-- 6. 修复用户数据不一致问题
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fix_user_data_inconsistency()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_fixed_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_details JSON[] := '{}';
  v_user_record RECORD;
BEGIN
  -- 修复在 auth.users 中存在但在 public.users 中缺失的用户
  FOR v_user_record IN
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL
  LOOP
    BEGIN
      INSERT INTO public.users (
        id, 
        email, 
        name, 
        role, 
        is_active, 
        created_at, 
        updated_at
      ) VALUES (
        v_user_record.id,
        v_user_record.email,
        COALESCE(v_user_record.raw_user_meta_data->>'name', v_user_record.email),
        COALESCE(v_user_record.raw_user_meta_data->>'role', 'operator'),
        true,
        NOW(),
        NOW()
      );
      
      v_fixed_count := v_fixed_count + 1;
      v_details := v_details || json_build_object(
        'action', 'created_public_user',
        'user_id', v_user_record.id,
        'email', v_user_record.email,
        'status', 'success'
      );
      
    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      v_details := v_details || json_build_object(
        'action', 'create_public_user_failed',
        'user_id', v_user_record.id,
        'email', v_user_record.email,
        'error', SQLERRM,
        'status', 'error'
      );
    END;
  END LOOP;
  
  -- 修复邮箱地址不一致的问题（以 auth.users 为准）
  FOR v_user_record IN
    SELECT au.id, au.email as auth_email, pu.email as public_email
    FROM auth.users au
    JOIN public.users pu ON au.id = pu.id
    WHERE au.email != pu.email
  LOOP
    BEGIN
      UPDATE public.users 
      SET 
        email = v_user_record.auth_email,
        updated_at = NOW()
      WHERE id = v_user_record.id;
      
      v_fixed_count := v_fixed_count + 1;
      v_details := v_details || json_build_object(
        'action', 'fixed_email_mismatch',
        'user_id', v_user_record.id,
        'old_email', v_user_record.public_email,
        'new_email', v_user_record.auth_email,
        'status', 'success'
      );
      
    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      v_details := v_details || json_build_object(
        'action', 'fix_email_mismatch_failed',
        'user_id', v_user_record.id,
        'error', SQLERRM,
        'status', 'error'
      );
    END;
  END LOOP;
  
  RETURN json_build_object(
    'success', v_error_count = 0,
    'summary', json_build_object(
      'fixed_count', v_fixed_count,
      'error_count', v_error_count,
      'total_processed', v_fixed_count + v_error_count
    ),
    'details', v_details,
    'fixed_at', NOW()
  );
END;
$function$;

-- ============================================================================
-- 7. 用户角色管理函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_user_role(
  p_user_id UUID,
  p_new_role TEXT,
  p_admin_user_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_admin_user_id UUID;
  v_admin_role TEXT;
  v_target_user RECORD;
BEGIN
  -- 获取执行操作的管理员用户ID
  v_admin_user_id := COALESCE(p_admin_user_id, auth.uid());
  
  IF v_admin_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', '用户未认证'
    );
  END IF;
  
  -- 检查管理员权限
  SELECT role INTO v_admin_role 
  FROM public.users 
  WHERE id = v_admin_user_id;
  
  IF v_admin_role != 'admin' THEN
    RETURN json_build_object(
      'success', false,
      'error', '权限不足，只有管理员可以修改用户角色'
    );
  END IF;
  
  -- 验证新角色
  IF p_new_role NOT IN ('admin', 'manager', 'operator') THEN
    RETURN json_build_object(
      'success', false,
      'error', '无效的用户角色'
    );
  END IF;
  
  -- 获取目标用户信息
  SELECT * INTO v_target_user 
  FROM public.users 
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', '目标用户不存在'
    );
  END IF;
  
  -- 防止管理员降级自己
  IF v_admin_user_id = p_user_id AND v_target_user.role = 'admin' AND p_new_role != 'admin' THEN
    RETURN json_build_object(
      'success', false,
      'error', '不能降级自己的管理员权限'
    );
  END IF;
  
  -- 更新 public.users 表
  UPDATE public.users 
  SET 
    role = p_new_role,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- 更新 auth.users 表的元数据
  UPDATE auth.users 
  SET 
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
                        jsonb_build_object('role', p_new_role),
    raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
                       jsonb_build_object('role', p_new_role),
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- 记录审计日志
  PERFORM public.log_audit_action(
    v_admin_user_id,
    'user_role_changed',
    'users',
    p_user_id,
    jsonb_build_object('old_role', v_target_user.role),
    jsonb_build_object('new_role', p_new_role)
  );
  
  RETURN json_build_object(
    'success', true,
    'user_id', p_user_id,
    'old_role', v_target_user.role,
    'new_role', p_new_role,
    'updated_by', v_admin_user_id,
    'updated_at', NOW(),
    'message', '用户角色更新成功'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', '更新用户角色失败: ' || SQLERRM
    );
END;
$function$;

-- ============================================================================
-- 8. 用户状态管理函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_user_status(
  p_user_id UUID,
  p_is_active BOOLEAN,
  p_admin_user_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_admin_user_id UUID;
  v_admin_role TEXT;
  v_target_user RECORD;
BEGIN
  -- 获取执行操作的管理员用户ID
  v_admin_user_id := COALESCE(p_admin_user_id, auth.uid());
  
  IF v_admin_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', '用户未认证'
    );
  END IF;
  
  -- 检查管理员权限
  SELECT role INTO v_admin_role 
  FROM public.users 
  WHERE id = v_admin_user_id;
  
  IF v_admin_role NOT IN ('admin', 'manager') THEN
    RETURN json_build_object(
      'success', false,
      'error', '权限不足，只有管理员和经理可以修改用户状态'
    );
  END IF;
  
  -- 获取目标用户信息
  SELECT * INTO v_target_user 
  FROM public.users 
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', '目标用户不存在'
    );
  END IF;
  
  -- 防止管理员禁用自己
  IF v_admin_user_id = p_user_id AND NOT p_is_active THEN
    RETURN json_build_object(
      'success', false,
      'error', '不能禁用自己的账户'
    );
  END IF;
  
  -- 更新用户状态
  UPDATE public.users 
  SET 
    is_active = p_is_active,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- 记录审计日志
  PERFORM public.log_audit_action(
    v_admin_user_id,
    'user_status_changed',
    'users',
    p_user_id,
    jsonb_build_object('old_status', v_target_user.is_active),
    jsonb_build_object('new_status', p_is_active)
  );
  
  RETURN json_build_object(
    'success', true,
    'user_id', p_user_id,
    'old_status', v_target_user.is_active,
    'new_status', p_is_active,
    'updated_by', v_admin_user_id,
    'updated_at', NOW(),
    'message', CASE 
      WHEN p_is_active THEN '用户已激活'
      ELSE '用户已禁用'
    END
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', '更新用户状态失败: ' || SQLERRM
    );
END;
$function$;

-- ============================================================================
-- 9. 用户登录记录更新函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_user_last_login(
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  UPDATE public.users 
  SET 
    last_login = NOW(),
    updated_at = NOW()
  WHERE id = v_user_id;
  
  RETURN FOUND;
END;
$function$;

-- ============================================================================
-- 10. 用户管理测试函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.test_user_management_functions()
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
  -- 测试1: 检查用户管理函数是否存在
  RETURN QUERY
  SELECT 
    'user_management_functions_exist'::TEXT,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' 
          AND routine_name IN (
            'create_user_complete', 
            'reset_user_password', 
            'update_user_role',
            'update_user_status'
          )
      ) THEN 'PASS'::TEXT
      ELSE 'FAIL'::TEXT
    END,
    'Checking if user management functions exist'::TEXT;
  
  -- 测试2: 检查触发器是否存在
  RETURN QUERY
  SELECT 
    'user_triggers_exist'::TEXT,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_schema = 'public' 
          AND trigger_name IN (
            'trigger_sync_user_metadata_to_jwt',
            'on_auth_user_created'
          )
      ) THEN 'PASS'::TEXT
      ELSE 'FAIL'::TEXT
    END,
    'Checking if user management triggers exist'::TEXT;
  
  -- 测试3: 检查用户数据一致性
  RETURN QUERY
  SELECT 
    'user_data_consistency'::TEXT,
    CASE 
      WHEN (SELECT COUNT(*) FROM public.check_user_data_consistency()) = 0
      THEN 'PASS'::TEXT
      ELSE 'WARNING'::TEXT
    END,
    'Checking user data consistency between auth.users and public.users'::TEXT;
END;
$function$;