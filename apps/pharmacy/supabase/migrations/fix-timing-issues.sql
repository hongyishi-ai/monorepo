-- Migration script to fix timing and sequence issues
-- Execute this script in Supabase SQL Editor to apply the fixes

-- 1. Add missing columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- 2. Update existing users to have is_active = true
UPDATE public.users 
SET is_active = true 
WHERE is_active IS NULL;

-- 3. Create improved role checking function
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

-- 4. Update user creation trigger to handle new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
  ON CONFLICT (id) DO UPDATE
  SET email = NEW.email,
      name = COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      role = COALESCE(NEW.raw_user_meta_data->>'role', EXCLUDED.role),
      last_login = NOW(),
      updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function to safely initialize system settings
CREATE OR REPLACE FUNCTION public.safe_initialize_system_settings()
RETURNS BOOLEAN AS $$
DECLARE
  current_user_role TEXT;
  settings_count INTEGER;
BEGIN
  -- Check if user is authenticated and is admin
  current_user_role := get_current_user_role();
  
  IF current_user_role IS NULL THEN
    RAISE NOTICE 'User not authenticated';
    RETURN FALSE;
  END IF;
  
  IF current_user_role != 'admin' THEN
    RAISE NOTICE 'User is not admin: %', current_user_role;
    RETURN FALSE;
  END IF;
  
  -- Check if settings already exist
  SELECT COUNT(*) INTO settings_count FROM public.system_settings;
  
  IF settings_count > 0 THEN
    RAISE NOTICE 'System settings already initialized';
    RETURN TRUE;
  END IF;
  
  -- Insert default settings
  INSERT INTO public.system_settings (key, value, description)
  VALUES
    ('expiry_warning_days', '30', '近效期提醒天数'),
    ('session_timeout', '28800', '会话超时时间（秒）'),
    ('auto_refresh_session', 'true', '是否自动刷新会话'),
    ('password_min_length', '8', '密码最小长度'),
    ('require_email_verification', 'true', '是否需要邮箱验证'),
    ('allow_self_registration', 'false', '是否允许自注册'),
    ('default_user_role', 'operator', '默认用户角色')
  ON CONFLICT (key) DO NOTHING;
  
  RAISE NOTICE 'System settings initialized successfully';
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Verify the migration
DO $$
DECLARE
  users_count INTEGER;
  settings_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO users_count FROM public.users;
  SELECT COUNT(*) INTO settings_count FROM public.system_settings;
  
  RAISE NOTICE 'Migration completed:';
  RAISE NOTICE '- Users table has % records', users_count;
  RAISE NOTICE '- System settings table has % records', settings_count;
  
  -- Check if users table has new columns
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'is_active'
    AND table_schema = 'public'
  ) THEN
    RAISE NOTICE '- is_active column added successfully';
  ELSE
    RAISE WARNING '- is_active column not found';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'last_login'
    AND table_schema = 'public'
  ) THEN
    RAISE NOTICE '- last_login column added successfully';
  ELSE
    RAISE WARNING '- last_login column not found';
  END IF;
END;
$$;
