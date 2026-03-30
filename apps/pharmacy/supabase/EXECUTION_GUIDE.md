# Supabase 安全修复执行指南

## 🚨 重要说明

由于 Supabase SQL Editor 的事务限制，我们需要分步执行安全修复脚本。

## 📋 执行步骤

### 步骤 1: 创建安全函数 ✅

1. 打开 Supabase 控制台 → SQL Editor
2. 复制并执行 `step1-security-functions.sql` 的全部内容
3. 确认看到 3 个函数创建成功的结果

**预期结果**:

```
routine_name      | routine_type | security_type
check_user_role   | FUNCTION     | DEFINER
get_user_role     | FUNCTION     | DEFINER
is_authenticated  | FUNCTION     | DEFINER
```

### 步骤 2: 修复 RLS 策略 ✅

1. 在 SQL Editor 中复制并执行 `step2-rls-policies.sql` 的全部内容
2. 确认所有策略创建成功

**预期结果**:

- 所有表的 `rls_enabled` 为 `true`
- 每个表都有相应数量的策略

### 步骤 3: 创建性能索引 ⚠️

**重要**: 索引必须逐个创建，不能批量执行！

#### 3.1 用户表索引

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON public.users USING btree (role);
```

等待完成后执行：

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON public.users USING btree (email);
```

#### 3.2 药品表索引

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medicines_barcode ON public.medicines USING btree (barcode);
```

等待完成后执行：

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medicines_name ON public.medicines USING btree (name);
```

等待完成后执行：

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medicines_manufacturer ON public.medicines USING btree (manufacturer);
```

#### 3.3 批次表索引

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_batches_medicine_id ON public.batches USING btree (medicine_id);
```

等待完成后执行：

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_batches_expiry_date ON public.batches USING btree (expiry_date);
```

等待完成后执行：

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_batches_batch_number ON public.batches USING btree (batch_number);
```

#### 3.4 库存交易表索引

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_transactions_medicine_id ON public.inventory_transactions USING btree (medicine_id);
```

等待完成后执行：

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_transactions_batch_id ON public.inventory_transactions USING btree (batch_id);
```

等待完成后执行：

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_transactions_user_id ON public.inventory_transactions USING btree (user_id);
```

等待完成后执行：

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_transactions_created_at ON public.inventory_transactions USING btree (created_at);
```

等待完成后执行：

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_transactions_type ON public.inventory_transactions USING btree (type);
```

### 步骤 4: 验证所有修复 ✅

执行验证查询：

```sql
-- 验证索引创建
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

## 🔧 替代方案：非并发索引

如果 `CONCURRENTLY` 索引创建仍有问题，可以使用普通索引：

### 方案 A: 普通索引（更快，但会短暂锁表）

将所有 `CREATE INDEX CONCURRENTLY` 改为 `CREATE INDEX`：

```sql
-- 示例：普通索引创建
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users USING btree (role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users USING btree (email);
-- ... 其他索引
```

**优点**: 可以批量执行，速度更快
**缺点**: 创建过程中会短暂锁表

### 方案 B: 跳过索引创建

如果索引创建有问题，可以先跳过，后续再添加：

1. 先执行步骤 1 和步骤 2（安全函数和 RLS 策略）
2. 运行 `npm run verify:security` 验证核心安全修复
3. 后续再逐个添加性能索引

## ⚠️ 常见问题

### 问题 1: 函数已存在

```
ERROR: function "check_user_role" already exists
```

**解决**: 这是正常的，说明函数已创建成功

### 问题 2: 策略已存在

```
ERROR: policy "authenticated_read_medicines" already exists
```

**解决**: 先执行 `DROP POLICY` 语句，再创建新策略

### 问题 3: 索引已存在

```
ERROR: relation "idx_users_role" already exists
```

**解决**: 这是正常的，说明索引已存在

### 问题 4: 表不存在

```
ERROR: relation "public.medicines" does not exist
```

**解决**: 检查表名是否正确，或者跳过该表的策略/索引

## 🎯 成功标准

执行完成后，应该看到：

1. **安全函数**: 3 个函数成功创建
2. **RLS 策略**: 所有表的 RLS 启用，策略正确应用
3. **性能索引**: 13 个索引成功创建（或根据实际表结构调整）

## 🔍 验证命令

完成所有步骤后，运行：

```bash
npm run verify:security
```

应该看到所有验证项目都显示 ✅ 通过。

## 📞 获取帮助

如果遇到问题：

1. 检查 Supabase 控制台的错误日志
2. 确认表结构是否与脚本匹配
3. 可以跳过有问题的索引，先完成核心安全修复
4. 联系技术支持获取进一步帮助
