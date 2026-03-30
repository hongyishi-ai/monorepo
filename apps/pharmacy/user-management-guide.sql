-- ============================================================================
-- 用户管理标准操作指南
-- 解决 auth.users 和 public.users 表的数据一致性问题
-- ============================================================================

-- ============================================================================
-- 1. 清理无效的 public.users 记录（没有对应 auth.users 的记录）
-- ============================================================================

-- 查看需要清理的记录
SELECT 
  '🗑️ 需要清理的无效用户' as action,
  p.email,
  p.name,
  p.role,
  '原因: 在 auth.users 中不存在' as reason
FROM public.users p
LEFT JOIN auth.users a ON p.id = a.id
WHERE a.id IS NULL;

-- 清理无效记录（可选执行）
/*
DELETE FROM public.users 
WHERE id NOT IN (
  SELECT id FROM auth.users
);
*/

-- ============================================================================
-- 2. 标准用户创建函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_user_complete(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT,
  p_role TEXT DEFAULT 'operator'
)
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  name TEXT,
  role TEXT,
  status TEXT
) AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- 验证角色
  IF p_role NOT IN ('admin', 'manager', 'operator') THEN
    RAISE EXCEPTION '无效角色: %。允许的角色: admin, manager, operator', p_role;
  END IF;

  -- 1. 在 auth.users 中创建认证账户
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    role
  ) VALUES (
    gen_random_uuid(),
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    'authenticated'
  ) RETURNING id INTO new_user_id;

  -- 2. 在 public.users 中创建业务信息
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    p_email,
    p_name,
    p_role,
    NOW(),
    NOW()
  );

  -- 返回创建结果
  RETURN QUERY
  SELECT 
    new_user_id,
    p_email,
    p_name,
    p_role,
    '✅ 用户创建成功' as status;

EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION '邮箱 % 已存在', p_email;
  WHEN OTHERS THEN
    RAISE EXCEPTION '创建用户失败: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. 用户密码重置函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reset_user_password(
  p_email TEXT,
  p_new_password TEXT
)
RETURNS TABLE(
  email TEXT,
  status TEXT,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- 更新密码
  UPDATE auth.users 
  SET 
    encrypted_password = crypt(p_new_password, gen_salt('bf')),
    updated_at = NOW()
  WHERE email = p_email;

  -- 检查是否更新成功
  IF NOT FOUND THEN
    RAISE EXCEPTION '用户 % 不存在', p_email;
  END IF;

  -- 返回结果
  RETURN QUERY
  SELECT 
    p_email,
    '✅ 密码重置成功' as status,
    NOW() as updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. 用户角色更新函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_user_role(
  p_email TEXT,
  p_new_role TEXT
)
RETURNS TABLE(
  email TEXT,
  old_role TEXT,
  new_role TEXT,
  status TEXT
) AS $$
DECLARE
  old_role_value TEXT;
BEGIN
  -- 验证角色
  IF p_new_role NOT IN ('admin', 'manager', 'operator') THEN
    RAISE EXCEPTION '无效角色: %。允许的角色: admin, manager, operator', p_new_role;
  END IF;

  -- 获取旧角色
  SELECT role INTO old_role_value
  FROM public.users
  WHERE email = p_email;

  IF NOT FOUND THEN
    RAISE EXCEPTION '用户 % 不存在', p_email;
  END IF;

  -- 更新角色
  UPDATE public.users 
  SET 
    role = p_new_role,
    updated_at = NOW()
  WHERE email = p_email;

  -- 返回结果
  RETURN QUERY
  SELECT 
    p_email,
    old_role_value,
    p_new_role,
    '✅ 角色更新成功' as status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. 用户删除函数（同时删除两个表的记录）
-- ============================================================================

CREATE OR REPLACE FUNCTION public.delete_user_complete(
  p_email TEXT
)
RETURNS TABLE(
  email TEXT,
  status TEXT
) AS $$
DECLARE
  user_uuid UUID;
BEGIN
  -- 获取用户 ID
  SELECT id INTO user_uuid
  FROM auth.users
  WHERE email = p_email;

  IF NOT FOUND THEN
    RAISE EXCEPTION '用户 % 不存在', p_email;
  END IF;

  -- 删除 public.users 记录
  DELETE FROM public.users WHERE id = user_uuid;

  -- 删除 auth.users 记录
  DELETE FROM auth.users WHERE id = user_uuid;

  -- 返回结果
  RETURN QUERY
  SELECT 
    p_email,
    '✅ 用户删除成功' as status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. 数据一致性检查函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_user_data_consistency()
RETURNS TABLE(
  check_type TEXT,
  email TEXT,
  issue TEXT,
  recommendation TEXT
) AS $$
BEGIN
  -- 检查 public.users 中存在但 auth.users 中不存在的记录
  RETURN QUERY
  SELECT 
    '❌ 孤立的业务用户' as check_type,
    p.email,
    '在 auth.users 中不存在，无法登录' as issue,
    '建议删除或创建对应的认证账户' as recommendation
  FROM public.users p
  LEFT JOIN auth.users a ON p.id = a.id
  WHERE a.id IS NULL;

  -- 检查 auth.users 中存在但 public.users 中不存在的记录
  RETURN QUERY
  SELECT 
    '❌ 孤立的认证用户' as check_type,
    a.email,
    '在 public.users 中不存在，缺少业务信息' as issue,
    '建议创建对应的业务用户记录' as recommendation
  FROM auth.users a
  LEFT JOIN public.users p ON a.id = p.id
  WHERE p.id IS NULL;

  -- 检查邮箱不一致的记录
  RETURN QUERY
  SELECT 
    '⚠️ 邮箱不一致' as check_type,
    a.email,
    '两个表中的邮箱不一致: auth=' || a.email || ', public=' || p.email as issue,
    '建议统一邮箱地址' as recommendation
  FROM auth.users a
  JOIN public.users p ON a.id = p.id
  WHERE a.email != p.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. 使用示例
-- ============================================================================

-- 创建新用户
/*
SELECT * FROM public.create_user_complete(
  'newuser@pharmacy.com',
  'Password123!',
  '新用户',
  'operator'
);
*/

-- 重置密码
/*
SELECT * FROM public.reset_user_password(
  'admin@pharmacy.com',
  'Admin123!'
);
*/

-- 更新角色
/*
SELECT * FROM public.update_user_role(
  'operator@pharmacy.com',
  'manager'
);
*/

-- 检查数据一致性
/*
SELECT * FROM public.check_user_data_consistency();
*/

-- 删除用户
/*
SELECT * FROM public.delete_user_complete(
  'unwanted@pharmacy.com'
);
*/
