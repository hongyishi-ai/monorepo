-- 清理可能导致重复库存更新的旧触发器（安全执行）
-- 在 Supabase SQL 控制台中执行本脚本

-- 检查现有触发器（可选）
-- SELECT tgname, tgenabled
-- FROM pg_trigger t
-- JOIN pg_class c ON c.oid = t.tgrelid
-- JOIN pg_namespace n ON n.oid = c.relnamespace
-- WHERE n.nspname = 'public' AND c.relname = 'inventory_transactions';

-- 删除可能遗留的旧触发器，避免与 process_inventory_transaction 的内置更新逻辑重复
DROP TRIGGER IF EXISTS update_batch_quantity_on_transaction ON public.inventory_transactions;
DROP TRIGGER IF EXISTS update_inventory_on_transaction ON public.inventory_transactions;

-- 如需确认新的触发器仅负责审计与撤回，可检查函数定义
-- SELECT pg_get_functiondef('public.handle_inventory_transaction()'::regprocedure);


