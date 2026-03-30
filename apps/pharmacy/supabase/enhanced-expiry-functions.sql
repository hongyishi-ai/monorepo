-- 增强的有效期管理函数
-- 支持分离的近效期和已过期药品查询
-- 更新时间: 2025-07-25

-- ============================================================================
-- 分离的有效期状态查询函数
-- ============================================================================

-- 获取近效期药品（不包括已过期）
CREATE OR REPLACE FUNCTION public.get_expiring_medicines_only(p_warning_days INTEGER DEFAULT NULL)
RETURNS TABLE (
  medicine_id UUID,
  medicine_name TEXT,
  barcode TEXT,
  batch_id UUID,
  batch_number TEXT,
  expiry_date DATE,
  quantity INTEGER,
  days_until_expiry INTEGER,
  urgency_level TEXT
) AS $$
DECLARE
  warning_threshold INTEGER;
BEGIN
  -- 获取预警天数设置
  IF p_warning_days IS NULL THEN
    SELECT value::INTEGER INTO warning_threshold
    FROM public.system_settings
    WHERE key = 'EXPIRY_WARNING_DAYS';
    
    warning_threshold := COALESCE(warning_threshold, 30);
  ELSE
    warning_threshold := p_warning_days;
  END IF;

  RETURN QUERY
  SELECT 
    m.id AS medicine_id,
    m.name AS medicine_name,
    m.barcode,
    b.id AS batch_id,
    b.batch_number,
    b.expiry_date,
    b.quantity,
    (b.expiry_date - CURRENT_DATE)::INTEGER AS days_until_expiry,
    CASE 
      WHEN (b.expiry_date - CURRENT_DATE) <= 7 THEN 'CRITICAL'
      WHEN (b.expiry_date - CURRENT_DATE) <= 15 THEN 'HIGH'
      WHEN (b.expiry_date - CURRENT_DATE) <= 30 THEN 'MEDIUM'
      ELSE 'LOW'
    END AS urgency_level
  FROM 
    public.medicines m
  JOIN 
    public.batches b ON m.id = b.medicine_id
  WHERE 
    b.quantity > 0
    AND b.expiry_date > CURRENT_DATE  -- 排除已过期
    AND (b.expiry_date - CURRENT_DATE) <= warning_threshold
  ORDER BY 
    days_until_expiry ASC, m.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取已过期药品统计
CREATE OR REPLACE FUNCTION public.get_expired_medicines_summary()
RETURNS TABLE (
  total_expired_medicines INTEGER,
  total_expired_batches INTEGER,
  total_expired_quantity INTEGER,
  oldest_expiry_date DATE,
  newest_expiry_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT m.id)::INTEGER AS total_expired_medicines,
    COUNT(b.id)::INTEGER AS total_expired_batches,
    COALESCE(SUM(b.quantity), 0)::INTEGER AS total_expired_quantity,
    MIN(b.expiry_date) AS oldest_expiry_date,
    MAX(b.expiry_date) AS newest_expiry_date
  FROM 
    public.medicines m
  JOIN 
    public.batches b ON m.id = b.medicine_id
  WHERE 
    b.quantity > 0
    AND b.expiry_date <= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取近效期药品统计（不包括已过期）
CREATE OR REPLACE FUNCTION public.get_expiring_medicines_summary(p_warning_days INTEGER DEFAULT NULL)
RETURNS TABLE (
  total_expiring_medicines INTEGER,
  total_expiring_batches INTEGER,
  total_expiring_quantity INTEGER,
  critical_count INTEGER,
  high_count INTEGER,
  medium_count INTEGER
) AS $$
DECLARE
  warning_threshold INTEGER;
BEGIN
  -- 获取预警天数设置
  IF p_warning_days IS NULL THEN
    SELECT value::INTEGER INTO warning_threshold
    FROM public.system_settings
    WHERE key = 'EXPIRY_WARNING_DAYS';
    
    warning_threshold := COALESCE(warning_threshold, 30);
  ELSE
    warning_threshold := p_warning_days;
  END IF;

  RETURN QUERY
  SELECT 
    COUNT(DISTINCT m.id)::INTEGER AS total_expiring_medicines,
    COUNT(b.id)::INTEGER AS total_expiring_batches,
    COALESCE(SUM(b.quantity), 0)::INTEGER AS total_expiring_quantity,
    COUNT(CASE WHEN (b.expiry_date - CURRENT_DATE) <= 7 THEN 1 END)::INTEGER AS critical_count,
    COUNT(CASE WHEN (b.expiry_date - CURRENT_DATE) BETWEEN 8 AND 15 THEN 1 END)::INTEGER AS high_count,
    COUNT(CASE WHEN (b.expiry_date - CURRENT_DATE) BETWEEN 16 AND 30 THEN 1 END)::INTEGER AS medium_count
  FROM 
    public.medicines m
  JOIN 
    public.batches b ON m.id = b.medicine_id
  WHERE 
    b.quantity > 0
    AND b.expiry_date > CURRENT_DATE  -- 排除已过期
    AND (b.expiry_date - CURRENT_DATE) <= warning_threshold;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取药品的综合有效期状态
CREATE OR REPLACE FUNCTION public.get_medicine_expiry_status(p_medicine_id UUID)
RETURNS TABLE (
  medicine_id UUID,
  medicine_name TEXT,
  total_quantity INTEGER,
  expired_quantity INTEGER,
  expiring_quantity INTEGER,
  normal_quantity INTEGER,
  overall_status TEXT,
  nearest_expiry_date DATE,
  expired_batches_count INTEGER,
  expiring_batches_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id AS medicine_id,
    m.name AS medicine_name,
    COALESCE(SUM(b.quantity), 0)::INTEGER AS total_quantity,
    COALESCE(SUM(CASE WHEN b.expiry_date <= CURRENT_DATE THEN b.quantity ELSE 0 END), 0)::INTEGER AS expired_quantity,
    COALESCE(SUM(CASE WHEN b.expiry_date > CURRENT_DATE AND (b.expiry_date - CURRENT_DATE) <= 30 THEN b.quantity ELSE 0 END), 0)::INTEGER AS expiring_quantity,
    COALESCE(SUM(CASE WHEN (b.expiry_date - CURRENT_DATE) > 30 THEN b.quantity ELSE 0 END), 0)::INTEGER AS normal_quantity,
    CASE 
      WHEN SUM(CASE WHEN b.expiry_date <= CURRENT_DATE THEN b.quantity ELSE 0 END) > 0 THEN 'EXPIRED'
      WHEN SUM(CASE WHEN b.expiry_date > CURRENT_DATE AND (b.expiry_date - CURRENT_DATE) <= 30 THEN b.quantity ELSE 0 END) > 0 THEN 'EXPIRING'
      ELSE 'NORMAL'
    END AS overall_status,
    MIN(CASE WHEN b.quantity > 0 THEN b.expiry_date END) AS nearest_expiry_date,
    COUNT(CASE WHEN b.expiry_date <= CURRENT_DATE AND b.quantity > 0 THEN 1 END)::INTEGER AS expired_batches_count,
    COUNT(CASE WHEN b.expiry_date > CURRENT_DATE AND (b.expiry_date - CURRENT_DATE) <= 30 AND b.quantity > 0 THEN 1 END)::INTEGER AS expiring_batches_count
  FROM 
    public.medicines m
  LEFT JOIN 
    public.batches b ON m.id = b.medicine_id
  WHERE 
    m.id = p_medicine_id
  GROUP BY 
    m.id, m.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建权限设置
GRANT EXECUTE ON FUNCTION public.get_expiring_medicines_only(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_expired_medicines_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_expiring_medicines_summary(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_medicine_expiry_status(UUID) TO authenticated;

-- 创建注释
COMMENT ON FUNCTION public.get_expiring_medicines_only(INTEGER) IS '获取近效期药品列表（不包括已过期）';
COMMENT ON FUNCTION public.get_expired_medicines_summary() IS '获取已过期药品统计信息';
COMMENT ON FUNCTION public.get_expiring_medicines_summary(INTEGER) IS '获取近效期药品统计信息（不包括已过期）';
COMMENT ON FUNCTION public.get_medicine_expiry_status(UUID) IS '获取单个药品的综合有效期状态';
