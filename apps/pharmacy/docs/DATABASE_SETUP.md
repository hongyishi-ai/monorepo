# 数据库设置指南

## 概述

本文档详细说明了药品出入库管理系统的数据库架构设置和验证过程。

## 数据库架构特性

### ✅ 已实现的功能

1. **完整的表结构**
   - `users` - 用户表，与 auth.users 同步
   - `medicines` - 药品基础信息表
   - `batches` - 批次信息表
   - `inventory_transactions` - 库存交易记录表
   - `system_settings` - 系统配置表

2. **触发器和自动化**
   - 用户同步触发器 (auth.users → public.users)
   - 自动更新时间戳触发器
   - 批次数量自动更新触发器
   - 库存不足检查触发器

3. **索引优化**
   - 药品条码索引 (唯一)
   - 药品名称索引
   - 生产厂商索引
   - 批次有效期索引
   - 库存交易时间索引

4. **数据完整性约束**
   - 外键约束
   - 检查约束 (数量 >= 0, 有效期 > 生产日期)
   - 唯一约束 (条码, 批次号)

5. **行级安全策略 (RLS)**
   - 基于用户角色的访问控制
   - 管理员、经理、操作员权限分离

6. **视图和函数**
   - 近效期药品视图
   - 库存不足药品视图
   - 药品库存汇总视图
   - 库存查询函数
   - FIFO 批次查询函数

## 设置步骤

### 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com)
2. 创建新项目
3. 等待项目初始化完成

### 2. 配置环境变量

复制 `.env.example` 到 `.env.development`:

```bash
cp .env.example .env.development
```

更新环境变量:

```env
# Supabase 配置
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. 执行数据库架构脚本

1. 登录 Supabase 仪表板
2. 进入 "SQL Editor"
3. 复制 `supabase/schema.sql` 的内容
4. 执行 SQL 脚本

### 4. 验证数据库设置

运行连接测试:

```bash
npm run test:supabase
```

## 数据库架构详情

### 表结构

#### users 表

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'operator')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### medicines 表

```sql
CREATE TABLE public.medicines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barcode TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  specification TEXT,
  manufacturer TEXT,
  shelf_location TEXT,
  safety_stock INTEGER NOT NULL DEFAULT 0 CHECK (safety_stock >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### batches 表

```sql
CREATE TABLE public.batches (
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
```

#### inventory_transactions 表

```sql
CREATE TABLE public.inventory_transactions (
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
```

#### system_settings 表

```sql
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 视图

#### 近效期药品视图

```sql
CREATE VIEW public.expiring_medicines AS
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
FROM public.medicines m
JOIN public.batches b ON m.id = b.medicine_id
WHERE b.quantity > 0
  AND (b.expiry_date - CURRENT_DATE) <= (SELECT value::integer FROM public.system_settings WHERE key = 'EXPIRY_WARNING_DAYS')
ORDER BY days_until_expiry ASC;
```

#### 库存不足药品视图

```sql
CREATE VIEW public.low_stock_medicines AS
SELECT
  m.id,
  m.name,
  m.barcode,
  m.shelf_location,
  m.safety_stock,
  COALESCE(SUM(b.quantity), 0) AS total_quantity,
  m.safety_stock - COALESCE(SUM(b.quantity), 0) AS shortage
FROM public.medicines m
LEFT JOIN public.batches b ON m.id = b.medicine_id AND b.quantity > 0 AND b.expiry_date > CURRENT_DATE
GROUP BY m.id, m.name, m.barcode, m.shelf_location, m.safety_stock
HAVING COALESCE(SUM(b.quantity), 0) < m.safety_stock
ORDER BY shortage DESC;
```

### 函数

#### 获取药品库存

```sql
CREATE FUNCTION public.get_medicine_stock(medicine_id UUID)
RETURNS TABLE (
  total_quantity INTEGER,
  active_batches INTEGER,
  earliest_expiry DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(b.quantity), 0)::INTEGER AS total_quantity,
    COUNT(DISTINCT b.id) FILTER (WHERE b.quantity > 0)::INTEGER AS active_batches,
    MIN(b.expiry_date) FILTER (WHERE b.quantity > 0) AS earliest_expiry
  FROM public.batches b
  WHERE b.medicine_id = get_medicine_stock.medicine_id
    AND b.quantity > 0;
END;
$$ LANGUAGE plpgsql;
```

#### 获取 FIFO 批次列表

```sql
CREATE FUNCTION public.get_medicine_batches_fifo(medicine_id UUID)
RETURNS TABLE (
  batch_id UUID,
  batch_number TEXT,
  production_date DATE,
  expiry_date DATE,
  quantity INTEGER,
  days_until_expiry INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id AS batch_id,
    b.batch_number,
    b.production_date,
    b.expiry_date,
    b.quantity,
    (b.expiry_date - CURRENT_DATE)::INTEGER AS days_until_expiry
  FROM public.batches b
  WHERE b.medicine_id = get_medicine_batches_fifo.medicine_id
    AND b.quantity > 0
  ORDER BY b.expiry_date ASC, b.production_date ASC;
END;
$$ LANGUAGE plpgsql;
```

### 安全策略

系统实现了基于角色的行级安全策略:

- **管理员 (admin)**: 完全访问权限
- **经理 (manager)**: 药品管理、库存操作、报表查看
- **操作员 (operator)**: 基本的入库出库操作

### 初始数据

系统会自动插入以下初始数据:

1. **系统设置**:
   - `EXPIRY_WARNING_DAYS`: 30 (近效期提醒天数)
   - `LOW_STOCK_THRESHOLD`: 10 (库存不足阈值)
   - `SCANNER_TIMEOUT`: 30000 (扫码超时时间)
   - `SCANNER_RETRY_COUNT`: 3 (扫码重试次数)

2. **管理员用户**:
   - 邮箱: admin@example.com
   - 角色: admin

## 业务规则实现

### 药品管理规则

- ✅ 药品条码唯一性约束
- ✅ 必填字段验证
- ✅ 安全库存非负约束

### 批次管理规则

- ✅ 批次号在同一药品下唯一
- ✅ 生产日期不能晚于当前日期
- ✅ 有效期必须晚于生产日期
- ✅ 批次数量非负约束

### 库存操作规则

- ✅ 入库数量必须大于 0
- ✅ 出库数量不能超过当前库存
- ✅ 自动按 FIFO 原则选择批次
- ✅ 库存变动自动记录日志

### 提醒和预警规则

- ✅ 近效期药品自动识别
- ✅ 库存不足自动提醒
- ✅ 可配置的提醒阈值

## 性能优化

### 索引策略

- 药品条码索引 (查询频繁)
- 药品名称索引 (搜索功能)
- 批次有效期索引 (近效期查询)
- 库存交易时间索引 (报表查询)

### 查询优化

- 使用视图预计算复杂查询
- 函数封装常用业务逻辑
- 适当的数据类型选择

## 故障排除

### 常见问题

1. **连接失败**
   - 检查 Supabase URL 和 API Key
   - 确认项目状态正常

2. **权限错误**
   - 检查 RLS 策略配置
   - 确认用户角色设置

3. **数据完整性错误**
   - 检查外键约束
   - 验证数据格式

### 调试工具

1. **连接测试**:

   ```bash
   npm run test:supabase
   ```

2. **SQL 查询测试**:
   使用 Supabase 仪表板的 SQL 编辑器

3. **日志查看**:
   在 Supabase 仪表板查看实时日志

## 维护建议

1. **定期备份**
   - 使用 Supabase 的自动备份功能
   - 定期导出重要数据

2. **性能监控**
   - 监控查询性能
   - 定期检查索引使用情况

3. **安全审计**
   - 定期检查 RLS 策略
   - 审查用户权限设置

## 总结

数据库架构已完全实现，包含:

- ✅ 5 个核心表
- ✅ 3 个业务视图
- ✅ 2 个查询函数
- ✅ 完整的触发器系统
- ✅ 行级安全策略
- ✅ 性能优化索引
- ✅ 数据完整性约束
- ✅ 初始数据设置

架构符合所有业务需求，支持扫码入库、出库、批次管理、库存监控等核心功能。
