-- ============================================================
-- 统一 System Settings 配置
-- 修复键名重复问题，统一使用小写键名
-- ============================================================

-- 1. 删除重复的 EXPIRY_WARNING_DAYS（全大写版本）
DELETE FROM public.system_settings
WHERE key = 'EXPIRY_WARNING_DAYS'
  AND EXISTS (
    SELECT 1 FROM public.system_settings
    WHERE key = 'expiry_warning_days'
  );

-- 2. 确保只有一个 expiry_warning_days（值应为 30）
UPDATE public.system_settings
SET value = '30', description = '近效期提醒天数（天）'
WHERE key = 'expiry_warning_days';

-- 3. 清理其他可能的重复键
DELETE FROM public.system_settings
WHERE key = 'expiry_warning_days'
  AND id NOT IN (
    SELECT MIN(id) FROM public.system_settings
    WHERE key = 'expiry_warning_days'
    GROUP BY key
  );

-- 4. 验证结果
SELECT key, value, description FROM public.system_settings ORDER BY key;
