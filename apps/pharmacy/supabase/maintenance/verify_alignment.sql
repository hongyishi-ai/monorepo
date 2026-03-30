-- 业务与数据库对齐快速校验脚本
-- 在 Supabase SQL 控制台中执行

-- 1) 关键函数存在性与签名
SELECT proname, proargnames
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND proname IN (
    'process_inventory_transaction',
    'add_batch_quantity',
    'check_batch_exists',
    'get_medicine_dependencies',
    'safe_delete_medicine',
    'get_batch_dependencies',
    'safe_delete_batch',
    'get_undoable_transactions',
    'undo_outbound_transaction'
  )
ORDER BY 1;

-- 2) RLS 启用情况
SELECT * FROM public.verify_rls_enabled();
SELECT * FROM public.verify_policy_count();

-- 3) 视图有效性
SELECT 'expiring_medicines' AS view, COUNT(*) AS cnt FROM public.expiring_medicines
UNION ALL
SELECT 'low_stock_medicines', COUNT(*) FROM public.low_stock_medicines;

-- 4) 字段存在性（medicines.unit）
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema='public' AND table_name='medicines' AND column_name='unit';

-- 5) 示例：检查 check_batch_exists 返回列
-- WITH m AS (SELECT id FROM public.medicines LIMIT 1)
-- SELECT * FROM public.check_batch_exists((SELECT id FROM m), 'DUMMY') LIMIT 1;


