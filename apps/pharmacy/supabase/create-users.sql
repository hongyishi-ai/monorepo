-- 创建管理员和操作员账户
-- 在 Supabase SQL 编辑器中执行此脚本

-- 注意：这个脚本只创建 public.users 表中的记录
-- 实际的认证用户需要通过 Supabase Auth API 创建

-- 1. 创建3个管理员账户
INSERT INTO public.users (id, email, name, role, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin1@pharmacy.com', '系统管理员1', 'admin', true),
  ('22222222-2222-2222-2222-222222222222', 'admin2@pharmacy.com', '系统管理员2', 'admin', true),
  ('33333333-3333-3333-3333-333333333333', 'admin3@pharmacy.com', '系统管理员3', 'admin', true)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 2. 创建7个操作员账户
INSERT INTO public.users (id, email, name, role, is_active) VALUES
  ('44444444-4444-4444-4444-444444444444', 'operator1@pharmacy.com', '操作员1', 'operator', true),
  ('55555555-5555-5555-5555-555555555555', 'operator2@pharmacy.com', '操作员2', 'operator', true),
  ('66666666-6666-6666-6666-666666666666', 'operator3@pharmacy.com', '操作员3', 'operator', true),
  ('77777777-7777-7777-7777-777777777777', 'operator4@pharmacy.com', '操作员4', 'operator', true),
  ('88888888-8888-8888-8888-888888888888', 'operator5@pharmacy.com', '操作员5', 'operator', true),
  ('99999999-9999-9999-9999-999999999999', 'operator6@pharmacy.com', '操作员6', 'operator', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'operator7@pharmacy.com', '操作员7', 'operator', true)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 3. 创建一个经理账户（用于测试）
INSERT INTO public.users (id, email, name, role, is_active) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'manager1@pharmacy.com', '药房经理', 'manager', true)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 4. 显示创建的用户
SELECT 
  id,
  email,
  name,
  role,
  is_active,
  created_at
FROM public.users
WHERE role IN ('admin', 'operator', 'manager')
ORDER BY role, name;

-- 5. 创建用于在应用中使用的认证用户的函数
-- 注意：这个函数需要在应用层调用 Supabase Auth API 来创建实际的认证用户

CREATE OR REPLACE FUNCTION public.create_auth_users_batch()
RETURNS TEXT AS $
DECLARE
  user_record RECORD;
  result_text TEXT := '';
BEGIN
  result_text := '需要在应用层创建以下认证用户：' || chr(10);
  
  FOR user_record IN 
    SELECT id, email, name, role 
    FROM public.users 
    WHERE role IN ('admin', 'operator', 'manager')
    ORDER BY role, name
  LOOP
    result_text := result_text || 
      'ID: ' || user_record.id || 
      ', Email: ' || user_record.email || 
      ', Name: ' || user_record.name || 
      ', Role: ' || user_record.role || chr(10);
  END LOOP;
  
  result_text := result_text || chr(10) || '请使用以下信息在 Supabase Auth 中创建用户：' || chr(10);
  result_text := result_text || '- 默认密码：pharmacy123' || chr(10);
  result_text := result_text || '- 用户需要在首次登录时修改密码' || chr(10);
  
  RETURN result_text;
END;
$ LANGUAGE plpgsql;

-- 执行函数查看需要创建的用户信息
SELECT public.create_auth_users_batch();

-- 6. 创建用户统计视图
CREATE OR REPLACE VIEW public.user_statistics AS
SELECT 
  role,
  COUNT(*) as user_count,
  COUNT(*) FILTER (WHERE is_active = true) as active_count,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_count,
  COUNT(*) FILTER (WHERE last_login IS NOT NULL) as logged_in_count
FROM public.users
GROUP BY role
ORDER BY 
  CASE role 
    WHEN 'admin' THEN 1 
    WHEN 'manager' THEN 2 
    WHEN 'operator' THEN 3 
    ELSE 4 
  END;

-- 查看用户统计
SELECT * FROM public.user_statistics;