-- 轻量健康检查 RPC
-- 返回 { ok: true, now: timestamp }

CREATE OR REPLACE FUNCTION public.health_check()
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'ok', true,
    'now', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','pg_catalog';


