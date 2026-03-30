-- 药品出入库管理系统数据库架构（更新版）
-- 基于实际数据库结构同步更新
-- 在 Supabase SQL 编辑器中执行此脚本

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户表 - 与 auth.users 同步
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'operator')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建触发器函数，用于同步 auth.users 和 public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $
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
$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_catalog';

-- 创建触发器，当 auth.users 有新用户时，自动创建对应的 public.users 记录
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 药品表
CREATE TABLE IF NOT EXISTS public.medicines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barcode TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  specification TEXT,
  manufacturer TEXT,
  shelf_location TEXT,
  safety_stock INTEGER NOT NULL DEFAULT 0 CHECK (safety_stock >= 0),
  unit TEXT NOT NULL DEFAULT '盒',
  category TEXT NOT NULL DEFAULT 'internal' CHECK (category IN ('internal', 'external', 'injection')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建药品表索引
CREATE INDEX IF NOT EXISTS idx_medicines_barcode ON public.medicines (barcode);
CREATE INDEX IF NOT EXISTS idx_medicines_name ON public.medicines (name);
CREATE INDEX IF NOT EXISTS idx_medicines_manufacturer ON public.medicines (manufacturer);

-- 批次表
CREATE TABLE IF NOT EXISTS public.batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  production_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (medicine_id, batch_number),
  CONSTRAINT check_expiry_after_production CHECK (expiry_date > production_date),
  CONSTRAINT check_production_not_future CHECK (production_date <= CURRENT_DATE)
);

-- 创建批次表索引
CREATE INDEX IF NOT EXISTS idx_batches_medicine_id ON public.batches (medicine_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiry_date ON public.batches (expiry_date);
CREATE INDEX IF NOT EXISTS idx_batches_quantity ON public.batches (quantity);

-- 库存交易表
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medicine_id UUID NOT NULL REFERENCES public.medicines(id),
  batch_id UUID NOT NULL REFERENCES public.batches(id),
  user_id UUID NOT NULL REFERENCES public.users(id),
  type TEXT NOT NULL CHECK (type IN ('inbound', 'outbound', 'adjustment', 'expired', 'damaged')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  remaining_quantity INTEGER NOT NULL CHECK (remaining_quantity >= 0),
  notes TEXT,
  reference_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建库存交易表索引
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_medicine_id ON public.inventory_transactions (medicine_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_batch_id ON public.inventory_transactions (batch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_user_id ON public.inventory_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON public.inventory_transactions (type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at ON public.inventory_transactions (created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_reference_number ON public.inventory_transactions (reference_number);

-- 系统设置表
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建系统设置表索引
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings (key);

-- 审计日志表
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('create_medicine', 'update_medicine', 'delete_medicine', 'create_batch', 'update_batch', 'delete_batch', 'inbound_transaction', 'outbound_transaction', 'undo_transaction')),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建审计日志表索引
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON public.audit_logs (action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs (table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON public.audit_logs (record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at);

-- 可撤回交易表
CREATE TABLE IF NOT EXISTS public.undoable_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES public.inventory_transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  medicine_id UUID NOT NULL REFERENCES public.medicines(id),
  batch_id UUID NOT NULL REFERENCES public.batches(id),
  original_quantity INTEGER NOT NULL,
  is_undone BOOLEAN DEFAULT FALSE,
  undo_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  undone_at TIMESTAMP WITH TIME ZONE,
  undone_by UUID REFERENCES public.users(id),
  undo_transaction_id UUID REFERENCES public.inventory_transactions(id)
);

-- 创建可撤回交易表索引
CREATE INDEX IF NOT EXISTS idx_undoable_transactions_transaction_id ON public.undoable_transactions (transaction_id);
CREATE INDEX IF NOT EXISTS idx_undoable_transactions_user_id ON public.undoable_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_undoable_transactions_is_undone ON public.undoable_transactions (is_undone);
CREATE INDEX IF NOT EXISTS idx_undoable_transactions_undo_deadline ON public.undoable_transactions (undo_deadline);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_catalog';

-- 为需要自动更新时间的表添加触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_medicines_updated_at ON public.medicines;
CREATE TRIGGER update_medicines_updated_at
BEFORE UPDATE ON public.medicines
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_batches_updated_at ON public.batches;
CREATE TRIGGER update_batches_updated_at
BEFORE UPDATE ON public.batches
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 用户元数据同步触发器函数
CREATE OR REPLACE FUNCTION public.sync_user_metadata_to_jwt()
RETURNS TRIGGER AS $
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
$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_catalog';

-- 创建用户元数据同步触发器
DROP TRIGGER IF EXISTS sync_user_metadata_trigger ON public.users;
CREATE TRIGGER sync_user_metadata_trigger
AFTER INSERT OR UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.sync_user_metadata_to_jwt();

-- 启用行级安全策略 (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.undoable_transactions ENABLE ROW LEVEL SECURITY;

-- 插入初始系统设置
INSERT INTO public.system_settings (key, value, description)
VALUES
  ('EXPIRY_WARNING_DAYS', '30', '近效期提醒天数'),
  ('expiry_warning_days', '30', '近效期提醒天数'),
  ('session_timeout', '28800', '会话超时时间（秒）'),
  ('auto_refresh_session', 'true', '是否自动刷新会话'),
  ('password_min_length', '8', '密码最小长度'),
  ('require_email_verification', 'true', '是否需要邮箱验证'),
  ('allow_self_registration', 'false', '是否允许自注册'),
  ('default_user_role', 'operator', '默认用户角色'),
  ('LOW_STOCK_THRESHOLD', '10', '库存不足提醒阈值'),
  ('SCANNER_TIMEOUT', '30000', '扫码超时时间（毫秒）'),
  ('SCANNER_RETRY_COUNT', '3', '扫码重试次数')
ON CONFLICT (key) DO NOTHING;

-- 创建视图：近效期药品视图
CREATE OR REPLACE VIEW public.expiring_medicines AS
SELECT 
  m.id AS medicine_id,
  m.name AS medicine_name,
  m.barcode,
  m.shelf_location,
  b.id AS batch_id,
  b.batch_number,
  b.expiry_date,
  b.quantity,
  (b.expiry_date - CURRENT_DATE) AS days_until_expiry,
  (SELECT value::integer FROM public.system_settings WHERE key = 'EXPIRY_WARNING_DAYS') AS warning_threshold
FROM 
  public.medicines m
JOIN 
  public.batches b ON m.id = b.medicine_id
WHERE 
  b.quantity > 0
  AND (b.expiry_date - CURRENT_DATE) <= (SELECT value::integer FROM public.system_settings WHERE key = 'EXPIRY_WARNING_DAYS')
ORDER BY 
  days_until_expiry ASC;

-- 创建视图：库存不足药品视图
CREATE OR REPLACE VIEW public.low_stock_medicines AS
SELECT 
  m.id,
  m.name,
  m.barcode,
  m.shelf_location,
  m.safety_stock,
  COALESCE(SUM(b.quantity), 0) AS total_quantity,
  m.safety_stock - COALESCE(SUM(b.quantity), 0) AS shortage
FROM 
  public.medicines m
LEFT JOIN 
  public.batches b ON m.id = b.medicine_id AND b.quantity > 0 AND b.expiry_date > CURRENT_DATE
GROUP BY 
  m.id, m.name, m.barcode, m.shelf_location, m.safety_stock
HAVING 
  COALESCE(SUM(b.quantity), 0) < m.safety_stock
ORDER BY 
  shortage DESC;

-- 创建视图：药品库存汇总视图
CREATE OR REPLACE VIEW public.medicine_inventory_summary AS
SELECT 
  m.id,
  m.name,
  m.barcode,
  m.specification,
  m.manufacturer,
  m.shelf_location,
  m.safety_stock,
  COALESCE(SUM(b.quantity), 0) AS total_quantity,
  COUNT(DISTINCT b.id) FILTER (WHERE b.quantity > 0) AS active_batches_count,
  MIN(b.expiry_date) FILTER (WHERE b.quantity > 0) AS earliest_expiry_date
FROM 
  public.medicines m
LEFT JOIN 
  public.batches b ON m.id = b.medicine_id AND b.quantity > 0
GROUP BY 
  m.id, m.name, m.barcode, m.specification, m.manufacturer, m.shelf_location, m.safety_stock;