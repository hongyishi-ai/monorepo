-- Archived legacy schema.sql (moved from supabase/schema.sql)
-- Kept for reference only. Do not execute; use schema-updated.sql instead.

-- 药品出入库管理系统数据库架构
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
  type TEXT NOT NULL CHECK (type IN ('inbound', 'outbound')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  remaining_quantity INTEGER NOT NULL CHECK (remaining_quantity >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建库存交易表索引
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_medicine_id ON public.inventory_transactions (medicine_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_batch_id ON public.inventory_transactions (batch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_user_id ON public.inventory_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON public.inventory_transactions (type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at ON public.inventory_transactions (created_at);

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

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要自动更新时间的表添加触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_medicines_updated_at ON public.medicines;
CREATE TRIGGER update_medicines_updated_at
BEFORE UPDATE ON public.medicines
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_batches_updated_at ON public.batches;
CREATE TRIGGER update_batches_updated_at
BEFORE UPDATE ON public.batches
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 创建批次数量更新触发器函数
CREATE OR REPLACE FUNCTION update_batch_quantity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'inbound' THEN
    UPDATE public.batches
    SET quantity = quantity + NEW.quantity
    WHERE id = NEW.batch_id;
  ELSIF NEW.type = 'outbound' THEN
    UPDATE public.batches
    SET quantity = quantity - NEW.quantity
    WHERE id = NEW.batch_id;
    
    -- 检查库存是否足够
    IF (SELECT quantity FROM public.batches WHERE id = NEW.batch_id) < 0 THEN
      RAISE EXCEPTION '库存不足，无法出库';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为库存交易表添加触发器，自动更新批次数量
DROP TRIGGER IF EXISTS update_batch_quantity_on_transaction ON public.inventory_transactions;
CREATE TRIGGER update_batch_quantity_on_transaction
AFTER INSERT ON public.inventory_transactions
FOR EACH ROW EXECUTE FUNCTION update_batch_quantity();

-- 启用行级安全策略 (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 插入初始系统设置
INSERT INTO public.system_settings (key, value, description)
VALUES
  ('EXPIRY_WARNING_DAYS', '30', '近效期提醒天数'),
  ('LOW_STOCK_THRESHOLD', '10', '库存不足提醒阈值'),
  ('SCANNER_TIMEOUT', '30000', '扫码超时时间（毫秒）'),
  ('SCANNER_RETRY_COUNT', '3', '扫码重试次数')
ON CONFLICT (key) DO NOTHING;

-- 插入管理员用户（请在实际使用时修改邮箱和角色）
INSERT INTO public.users (email, name, role)
VALUES ('admin@example.com', '系统管理员', 'admin')
ON CONFLICT (email) DO NOTHING;

-- 近效期与低库存视图、库存汇总视图等（原样保留）
-- ...


