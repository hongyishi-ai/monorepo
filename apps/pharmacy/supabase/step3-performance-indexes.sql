-- ============================================================================
-- 步骤 3: 创建性能索引
-- 在 Supabase SQL Editor 中逐个执行这些索引创建语句
-- 注意：每个 CREATE INDEX 语句需要单独执行，不能作为事务块
-- ============================================================================

-- 重要说明：
-- 1. 请逐个复制并执行下面的每个 CREATE INDEX 语句
-- 2. 不要一次性选择所有语句执行
-- 3. 每执行一个索引后，等待完成再执行下一个
-- 4. 如果某个索引已存在，会显示 "already exists" 错误，这是正常的

-- 3.1 用户表索引
-- ============================================================================

-- 用户角色索引（逐个执行）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON public.users USING btree (role);

-- 用户邮箱索引（逐个执行）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON public.users USING btree (email);

-- 3.2 药品表索引
-- ============================================================================

-- 药品条码索引（逐个执行）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medicines_barcode ON public.medicines USING btree (barcode);

-- 药品名称索引（逐个执行）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medicines_name ON public.medicines USING btree (name);

-- 药品制造商索引（逐个执行）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medicines_manufacturer ON public.medicines USING btree (manufacturer);

-- 3.3 批次表索引
-- ============================================================================

-- 批次药品ID索引（逐个执行）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_batches_medicine_id ON public.batches USING btree (medicine_id);

-- 批次过期日期索引（逐个执行）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_batches_expiry_date ON public.batches USING btree (expiry_date);

-- 批次号索引（逐个执行）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_batches_batch_number ON public.batches USING btree (batch_number);

-- 3.4 库存交易表索引
-- ============================================================================

-- 交易药品ID索引（逐个执行）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_transactions_medicine_id ON public.inventory_transactions USING btree (medicine_id);

-- 交易批次ID索引（逐个执行）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_transactions_batch_id ON public.inventory_transactions USING btree (batch_id);

-- 交易用户ID索引（逐个执行）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_transactions_user_id ON public.inventory_transactions USING btree (user_id);

-- 交易创建时间索引（逐个执行）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_transactions_created_at ON public.inventory_transactions USING btree (created_at);

-- 交易类型索引（逐个执行）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_transactions_type ON public.inventory_transactions USING btree (type);

-- ============================================================================
-- 验证索引创建（在所有索引创建完成后执行）
-- ============================================================================

-- 验证索引创建结果
SELECT 
  schemaname, 
  tablename, 
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 统计每个表的索引数量
SELECT 
  schemaname,
  tablename,
  COUNT(*) as index_count
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
GROUP BY schemaname, tablename
ORDER BY tablename;
