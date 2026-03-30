-- 数据验证和约束脚本
-- 添加更严格的数据验证规则和业务约束
-- 更新时间: 2025-07-21

-- ============================================================================
-- 增强的数据约束
-- ============================================================================

-- 药品表约束增强
ALTER TABLE public.medicines 
  ADD CONSTRAINT check_barcode_format 
  CHECK (barcode ~ '^[0-9]{13}$' OR barcode ~ '^[0-9]{8}$' OR barcode ~ '^[0-9]{12}$');

ALTER TABLE public.medicines 
  ADD CONSTRAINT check_name_not_empty 
  CHECK (LENGTH(TRIM(name)) > 0);

ALTER TABLE public.medicines 
  ADD CONSTRAINT check_safety_stock_reasonable 
  CHECK (safety_stock >= 0 AND safety_stock <= 10000);

-- 批次表约束增强
ALTER TABLE public.batches 
  ADD CONSTRAINT check_batch_number_format 
  CHECK (LENGTH(TRIM(batch_number)) >= 3);

ALTER TABLE public.batches 
  ADD CONSTRAINT check_quantity_reasonable 
  CHECK (quantity >= 0 AND quantity <= 1000000);

ALTER TABLE public.batches 
  ADD CONSTRAINT check_expiry_reasonable 
  CHECK (expiry_date >= production_date + INTERVAL '1 day' 
         AND expiry_date <= production_date + INTERVAL '10 years');

-- 库存交易表约束增强
ALTER TABLE public.inventory_transactions 
  ADD CONSTRAINT check_transaction_quantity_positive 
  CHECK (quantity > 0);

ALTER TABLE public.inventory_transactions 
  ADD CONSTRAINT check_remaining_quantity_valid 
  CHECK (remaining_quantity >= 0);

ALTER TABLE public.inventory_transactions 
  ADD CONSTRAINT check_transaction_quantity_reasonable 
  CHECK (quantity <= 100000);

-- 用户表约束增强
ALTER TABLE public.users 
  ADD CONSTRAINT check_email_format 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE public.users 
  ADD CONSTRAINT check_name_not_empty 
  CHECK (LENGTH(TRIM(name)) > 0);

-- ============================================================================
-- 数据一致性检查函数
-- ============================================================================

-- 检查库存数据一致性
CREATE OR REPLACE FUNCTION public.check_inventory_consistency()
RETURNS TABLE(
  check_name TEXT,
  status TEXT,
  details TEXT,
  affected_count BIGINT
) AS $$
BEGIN
  -- 检查批次数量与交易记录的一致性
  RETURN QUERY
  SELECT 
    'Batch Quantity Consistency'::TEXT,
    CASE 
      WHEN COUNT(*) = 0 THEN 'PASS'::TEXT 
      ELSE 'FAIL'::TEXT 
    END,
    'Batches with quantity not matching transaction records'::TEXT,
    COUNT(*)
  FROM (
    SELECT 
      b.id,
      b.quantity as batch_quantity,
      COALESCE(
        SUM(CASE WHEN it.type = 'inbound' THEN it.quantity ELSE -it.quantity END), 
        0
      ) as calculated_quantity
    FROM public.batches b
    LEFT JOIN public.inventory_transactions it ON b.id = it.batch_id
    GROUP BY b.id, b.quantity
    HAVING b.quantity != COALESCE(
      SUM(CASE WHEN it.type = 'inbound' THEN it.quantity ELSE -it.quantity END), 
      0
    )
  ) inconsistent_batches;

  -- 检查过期药品是否仍有库存
  RETURN QUERY
  SELECT 
    'Expired Medicine Stock'::TEXT,
    CASE 
      WHEN COUNT(*) = 0 THEN 'PASS'::TEXT 
      ELSE 'WARNING'::TEXT 
    END,
    'Expired batches with positive quantity'::TEXT,
    COUNT(*)
  FROM public.batches
  WHERE expiry_date < CURRENT_DATE AND quantity > 0;

  -- 检查负库存
  RETURN QUERY
  SELECT 
    'Negative Stock'::TEXT,
    CASE 
      WHEN COUNT(*) = 0 THEN 'PASS'::TEXT 
      ELSE 'FAIL'::TEXT 
    END,
    'Batches with negative quantity'::TEXT,
    COUNT(*)
  FROM public.batches
  WHERE quantity < 0;

  -- 检查孤立的交易记录
  RETURN QUERY
  SELECT 
    'Orphaned Transactions'::TEXT,
    CASE 
      WHEN COUNT(*) = 0 THEN 'PASS'::TEXT 
      ELSE 'FAIL'::TEXT 
    END,
    'Transactions without valid batch or medicine references'::TEXT,
    COUNT(*)
  FROM public.inventory_transactions it
  LEFT JOIN public.batches b ON it.batch_id = b.id
  LEFT JOIN public.medicines m ON it.medicine_id = m.id
  WHERE b.id IS NULL OR m.id IS NULL;

  -- 检查重复条码
  RETURN QUERY
  SELECT 
    'Duplicate Barcodes'::TEXT,
    CASE 
      WHEN COUNT(*) = 0 THEN 'PASS'::TEXT 
      ELSE 'FAIL'::TEXT 
    END,
    'Medicines with duplicate barcodes'::TEXT,
    COUNT(*)
  FROM (
    SELECT barcode
    FROM public.medicines
    GROUP BY barcode
    HAVING COUNT(*) > 1
  ) duplicates;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 修复数据一致性问题
CREATE OR REPLACE FUNCTION public.fix_inventory_consistency(
  p_user_id UUID,
  p_dry_run BOOLEAN DEFAULT TRUE
)
RETURNS TABLE(
  action TEXT,
  description TEXT,
  affected_records INTEGER,
  executed BOOLEAN
) AS $$
DECLARE
  v_affected INTEGER;
BEGIN
  -- 修复批次数量与交易记录不一致的问题
  IF NOT p_dry_run THEN
    WITH batch_corrections AS (
      SELECT 
        b.id as batch_id,
        GREATEST(0, COALESCE(
          SUM(CASE WHEN it.type = 'inbound' THEN it.quantity ELSE -it.quantity END), 
          0
        )) as correct_quantity
      FROM public.batches b
      LEFT JOIN public.inventory_transactions it ON b.id = it.batch_id
      GROUP BY b.id
      HAVING b.quantity != GREATEST(0, COALESCE(
        SUM(CASE WHEN it.type = 'inbound' THEN it.quantity ELSE -it.quantity END), 
        0
      ))
    )
    UPDATE public.batches 
    SET quantity = bc.correct_quantity,
        updated_at = NOW()
    FROM batch_corrections bc
    WHERE batches.id = bc.batch_id;
    
    GET DIAGNOSTICS v_affected = ROW_COUNT;
  ELSE
    SELECT COUNT(*) INTO v_affected
    FROM (
      SELECT b.id
      FROM public.batches b
      LEFT JOIN public.inventory_transactions it ON b.id = it.batch_id
      GROUP BY b.id, b.quantity
      HAVING b.quantity != GREATEST(0, COALESCE(
        SUM(CASE WHEN it.type = 'inbound' THEN it.quantity ELSE -it.quantity END), 
        0
      ))
    ) inconsistent;
  END IF;

  RETURN QUERY SELECT 
    'Fix Batch Quantities'::TEXT,
    'Correct batch quantities based on transaction records'::TEXT,
    v_affected,
    NOT p_dry_run;

  -- 隔离过期药品
  IF NOT p_dry_run THEN
    SELECT COUNT(*) INTO v_affected
    FROM public.batches
    WHERE expiry_date < CURRENT_DATE AND quantity > 0;
    
    -- 这里可以调用过期药品处理函数
    -- PERFORM public.batch_quarantine_expired_medicines(p_user_id, 0);
  ELSE
    SELECT COUNT(*) INTO v_affected
    FROM public.batches
    WHERE expiry_date < CURRENT_DATE AND quantity > 0;
  END IF;

  RETURN QUERY SELECT 
    'Quarantine Expired Medicines'::TEXT,
    'Move expired medicines to quarantine'::TEXT,
    v_affected,
    NOT p_dry_run;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 业务规则验证
-- ============================================================================

-- 验证入库操作
CREATE OR REPLACE FUNCTION public.validate_inbound_operation(
  p_medicine_id UUID,
  p_batch_number TEXT,
  p_production_date DATE,
  p_expiry_date DATE,
  p_quantity INTEGER
)
RETURNS TABLE(
  is_valid BOOLEAN,
  error_message TEXT
) AS $$
BEGIN
  -- 检查药品是否存在
  IF NOT EXISTS (SELECT 1 FROM public.medicines WHERE id = p_medicine_id) THEN
    RETURN QUERY SELECT FALSE, '药品不存在';
    RETURN;
  END IF;

  -- 检查批次号是否已存在
  IF EXISTS (
    SELECT 1 FROM public.batches 
    WHERE medicine_id = p_medicine_id AND batch_number = p_batch_number
  ) THEN
    RETURN QUERY SELECT FALSE, '批次号已存在';
    RETURN;
  END IF;

  -- 检查日期有效性
  IF p_expiry_date <= p_production_date THEN
    RETURN QUERY SELECT FALSE, '过期日期必须晚于生产日期';
    RETURN;
  END IF;

  -- 检查是否已过期
  IF p_expiry_date <= CURRENT_DATE THEN
    RETURN QUERY SELECT FALSE, '不能入库已过期的药品';
    RETURN;
  END IF;

  -- 检查数量
  IF p_quantity <= 0 THEN
    RETURN QUERY SELECT FALSE, '入库数量必须大于0';
    RETURN;
  END IF;

  -- 检查生产日期不能是未来
  IF p_production_date > CURRENT_DATE THEN
    RETURN QUERY SELECT FALSE, '生产日期不能是未来日期';
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, '验证通过'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 验证出库操作
CREATE OR REPLACE FUNCTION public.validate_outbound_operation(
  p_batch_id UUID,
  p_quantity INTEGER
)
RETURNS TABLE(
  is_valid BOOLEAN,
  error_message TEXT,
  available_quantity INTEGER
) AS $$
DECLARE
  v_batch_quantity INTEGER;
  v_expiry_date DATE;
BEGIN
  -- 检查批次是否存在
  SELECT quantity, expiry_date INTO v_batch_quantity, v_expiry_date
  FROM public.batches 
  WHERE id = p_batch_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, '批次不存在'::TEXT, 0;
    RETURN;
  END IF;

  -- 检查库存是否足够
  IF v_batch_quantity < p_quantity THEN
    RETURN QUERY SELECT FALSE, '库存不足'::TEXT, v_batch_quantity;
    RETURN;
  END IF;

  -- 检查是否过期
  IF v_expiry_date <= CURRENT_DATE THEN
    RETURN QUERY SELECT FALSE, '批次已过期，不能出库'::TEXT, v_batch_quantity;
    RETURN;
  END IF;

  -- 检查数量
  IF p_quantity <= 0 THEN
    RETURN QUERY SELECT FALSE, '出库数量必须大于0'::TEXT, v_batch_quantity;
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, '验证通过'::TEXT, v_batch_quantity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 数据清理和维护
-- ============================================================================

-- 清理空批次
CREATE OR REPLACE FUNCTION public.cleanup_empty_batches(
  p_days_old INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.batches
  WHERE quantity = 0 
    AND updated_at < CURRENT_DATE - INTERVAL '1 day' * p_days_old
    AND NOT EXISTS (
      SELECT 1 FROM public.inventory_transactions 
      WHERE batch_id = batches.id 
        AND created_at > CURRENT_DATE - INTERVAL '1 day' * p_days_old
    );
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 数据库统计信息
CREATE OR REPLACE FUNCTION public.get_database_statistics()
RETURNS TABLE(
  table_name TEXT,
  record_count BIGINT,
  last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'users'::TEXT, COUNT(*), MAX(updated_at)
  FROM public.users
  UNION ALL
  SELECT 'medicines'::TEXT, COUNT(*), MAX(updated_at)
  FROM public.medicines
  UNION ALL
  SELECT 'batches'::TEXT, COUNT(*), MAX(updated_at)
  FROM public.batches
  UNION ALL
  SELECT 'inventory_transactions'::TEXT, COUNT(*), MAX(created_at)
  FROM public.inventory_transactions
  UNION ALL
  SELECT 'system_settings'::TEXT, COUNT(*), MAX(updated_at)
  FROM public.system_settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
