-- 创建 system_settings 表
-- 用于存储系统配置参数

-- 创建表
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings (key);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 启用 RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "Allow authenticated users to read system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Allow admins to modify system settings" ON public.system_settings;

-- 创建 RLS 策略（允许所有认证用户读取）
CREATE POLICY "Allow authenticated users to read system settings"
  ON public.system_settings FOR SELECT
  TO authenticated
  USING (true);

-- 创建 RLS 策略（只允许管理员修改）
CREATE POLICY "Allow admins to modify system settings"
  ON public.system_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- 插入默认系统设置
INSERT INTO public.system_settings (key, value, description) VALUES
  ('expiry_warning_days', '30', '近效期提醒天数'),
  ('session_timeout', '28800', '会话超时时间（秒）'),
  ('auto_refresh_session', 'true', '是否自动刷新会话'),
  ('password_min_length', '8', '密码最小长度'),
  ('require_email_verification', 'true', '是否需要邮箱验证'),
  ('allow_self_registration', 'false', '是否允许自注册'),
  ('default_user_role', 'operator', '默认用户角色'),
  ('system_initialized', 'true', '系统是否已初始化')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 验证表创建
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings') THEN
    RAISE NOTICE '✅ system_settings 表创建成功';
  ELSE
    RAISE EXCEPTION '❌ system_settings 表创建失败';
  END IF;
END $$;
