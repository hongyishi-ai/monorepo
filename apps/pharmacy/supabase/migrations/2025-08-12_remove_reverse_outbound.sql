-- 移除兼容函数：reverse_outbound_transaction
-- 说明：前端与服务层均使用 undo_outbound_transaction，删除该旧函数以避免混淆。

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'reverse_outbound_transaction'
  ) THEN
    DROP FUNCTION public.reverse_outbound_transaction(UUID, UUID, TEXT);
  END IF;
END $$;


