-- [已弃用] 请改用 `migrations/2025-08-12_atomic_inventory_update.sql`
-- 理由：避免 BEFORE 触发器与过程函数重复更新库存，统一由过程函数负责库存变更

-- ============================================================================
-- 1. 修复批次更新触发器，解决重复触发器问题
-- ============================================================================

-- 删除旧的触发器，避免重复更新批次数量
DROP TRIGGER IF EXISTS update_batch_quantity_on_transaction ON public.inventory_transactions;
DROP TRIGGER IF EXISTS update_inventory_on_transaction ON public.inventory_transactions;

-- 创建增强版库存更新触发器函数
CREATE OR REPLACE FUNCTION public.update_inventory_on_transaction()
RETURNS TRIGGER AS $
DECLARE
  current_batch_quantity INTEGER;
  medicine_name TEXT;
BEGIN
  -- 获取当前批次数量和药品名称（用于错误消息）
  SELECT b.quantity, m.name INTO current_batch_quantity, medicine_name
  FROM public.batches b
  JOIN public.medicines m ON b.medicine_id = m.id
  WHERE b.id = NEW.batch_id;

  IF NEW.type = 'inbound' THEN
    -- 入库：增加批次数量
    UPDATE public.batches
    SET quantity = quantity + NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.batch_id;
    
    -- 更新交易记录的剩余数量
    NEW.remaining_quantity = current_batch_quantity + NEW.quantity;
    
  ELSIF NEW.type = 'outbound' THEN
    -- 出库：检查库存是否足够
    IF current_batch_quantity < NEW.quantity THEN
      RAISE EXCEPTION '库存不足：药品 % (批次 %) 当前库存 %，请求出库 %', 
        medicine_name, NEW.batch_id, current_batch_quantity, NEW.quantity;
    END IF;
    
    -- 减少批次数量
    UPDATE public.batches
    SET quantity = quantity - NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.batch_id;
    
    -- 更新交易记录的剩余数量
    NEW.remaining_quantity = current_batch_quantity - NEW.quantity;
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- 创建新的触发器
CREATE TRIGGER update_inventory_on_transaction
  BEFORE INSERT ON public.inventory_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_inventory_on_transaction();

-- ============================================================================
-- 2. 增强版 FIFO 出库函数，改进并发处理和错误处理
-- ============================================================================

-- 创建增强版先进先出出库函数
CREATE OR REPLACE FUNCTION public.process_outbound_fifo(
  p_medicine_id UUID,
  p_user_id UUID,
  p_quantity INTEGER,
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  transaction_id UUID,
  batch_id UUID,
  batch_number TEXT,
  quantity_used INTEGER,
  remaining_quantity INTEGER,
  expiry_date DATE
) AS $
DECLARE
  remaining_to_process INTEGER := p_quantity;
  current_batch RECORD;
  new_transaction_id UUID;
  batch_quantity INTEGER;
  medicine_name TEXT;
  total_available INTEGER;
BEGIN
  -- 获取药品名称（用于错误消息）
  SELECT name INTO medicine_name FROM public.medicines WHERE id = p_medicine_id;
  IF medicine_name IS NULL THEN
    RAISE EXCEPTION '药品不存在：ID %', p_medicine_id;
  END IF;

  -- 检查总库存是否足够
  SELECT COALESCE(SUM(b.quantity), 0) INTO total_available
  FROM public.batches b 
  WHERE b.medicine_id = p_medicine_id 
    AND b.quantity > 0
    AND b.expiry_date > CURRENT_DATE;
    
  IF total_available < p_quantity THEN
    RAISE EXCEPTION '药品 % 库存不足：需要 %，可用 %', 
      medicine_name, p_quantity, total_available;
  END IF;

  -- 锁定相关批次，防止并发修改
  PERFORM id FROM public.batches 
  WHERE medicine_id = p_medicine_id AND quantity > 0
  FOR UPDATE;

  -- 按先进先出原则处理批次
  FOR current_batch IN
    SELECT b.id, b.batch_number, b.quantity, b.expiry_date, b.production_date
    FROM public.batches b
    WHERE b.medicine_id = p_medicine_id 
      AND b.quantity > 0
      AND b.expiry_date > CURRENT_DATE  -- 排除已过期批次
    ORDER BY b.expiry_date ASC, b.production_date ASC
  LOOP
    -- 计算本批次使用数量
    batch_quantity := LEAST(current_batch.quantity, remaining_to_process);
    
    -- 创建出库交易记录
    INSERT INTO public.inventory_transactions (
      medicine_id, batch_id, user_id, type, quantity, remaining_quantity, notes
    ) VALUES (
      p_medicine_id, current_batch.id, p_user_id, 'outbound', 
      batch_quantity, current_batch.quantity - batch_quantity, p_notes
    ) RETURNING id INTO new_transaction_id;
    
    -- 返回交易信息
    RETURN QUERY SELECT 
      new_transaction_id,
      current_batch.id,
      current_batch.batch_number,
      batch_quantity,
      current_batch.quantity - batch_quantity,
      current_batch.expiry_date;
    
    -- 更新剩余需要处理的数量
    remaining_to_process := remaining_to_process - batch_quantity;
    
    -- 如果已经处理完毕，退出循环
    EXIT WHEN remaining_to_process <= 0;
  END LOOP;
  
  -- 检查是否还有未处理的数量
  IF remaining_to_process > 0 THEN
    RAISE EXCEPTION '无法完成药品 % 出库：还需要 % 数量，但没有足够的有效批次', 
      medicine_name, remaining_to_process;
  END IF;
END;
$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. 批次锁定函数，用于并发操作控制
-- ============================================================================

-- 创建批次锁定函数
CREATE OR REPLACE FUNCTION public.lock_medicine_batches(medicine_id UUID)
RETURNS VOID AS $
BEGIN
  -- 锁定指定药品的所有批次，防止并发修改
  PERFORM id FROM public.batches 
  WHERE medicine_id = lock_medicine_batches.medicine_id
  FOR UPDATE;
END;
$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. 数据完整性验证函数
-- ============================================================================

-- 创建库存数据完整性验证函数
CREATE OR REPLACE FUNCTION public.validate_inventory_integrity()
RETURNS TABLE (
  issue_type TEXT,
  medicine_id UUID,
  medicine_name TEXT,
  batch_id UUID,
  batch_number TEXT,
  calculated_quantity INTEGER,
  recorded_quantity INTEGER,
  discrepancy INTEGER
) AS $
BEGIN
  -- 检查批次数量与交易记录是否一致
  RETURN QUERY
  WITH transaction_sums AS (
    SELECT 
      it.batch_id,
      SUM(CASE WHEN it.type = 'inbound' THEN it.quantity ELSE -it.quantity END) AS calculated_quantity
    FROM 
      public.inventory_transactions it
    GROUP BY 
      it.batch_id
  )
  SELECT 
    '批次数量不一致'::TEXT AS issue_type,
    m.id AS medicine_id,
    m.name AS medicine_name,
    b.id AS batch_id,
    b.batch_number,
    COALESCE(ts.calculated_quantity, 0) AS calculated_quantity,
    b.quantity AS recorded_quantity,
    (b.quantity - COALESCE(ts.calculated_quantity, 0)) AS discrepancy
  FROM 
    public.batches b
  JOIN 
    public.medicines m ON b.medicine_id = m.id
  LEFT JOIN 
    transaction_sums ts ON b.id = ts.batch_id
  WHERE 
    b.quantity != COALESCE(ts.calculated_quantity, 0);
END;
$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. 库存修复函数
-- ============================================================================

-- 创建库存数据修复函数
CREATE OR REPLACE FUNCTION public.fix_inventory_discrepancies()
RETURNS TABLE (
  batch_id UUID,
  medicine_name TEXT,
  batch_number TEXT,
  old_quantity INTEGER,
  new_quantity INTEGER,
  fixed BOOLEAN
) AS $
DECLARE
  discrepancy_record RECORD;
BEGIN
  -- 查找并修复所有批次数量不一致的问题
  FOR discrepancy_record IN
    SELECT * FROM public.validate_inventory_integrity()
  LOOP
    -- 更新批次数量为计算值
    UPDATE public.batches
    SET quantity = discrepancy_record.calculated_quantity,
        updated_at = NOW()
    WHERE id = discrepancy_record.batch_id;
    
    -- 返回修复结果
    RETURN QUERY
    SELECT 
      discrepancy_record.batch_id,
      discrepancy_record.medicine_name,
      discrepancy_record.batch_number,
      discrepancy_record.recorded_quantity,
      discrepancy_record.calculated_quantity,
      TRUE AS fixed;
  END LOOP;
END;
$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. 批次库存汇总视图（优化版）
-- ============================================================================

-- 创建批次库存汇总视图
DROP VIEW IF EXISTS public.batch_inventory_summary;
CREATE VIEW public.batch_inventory_summary AS
SELECT 
  b.id AS batch_id,
  m.id AS medicine_id,
  m.name AS medicine_name,
  m.barcode,
  b.batch_number,
  b.production_date,
  b.expiry_date,
  b.quantity,
  (b.expiry_date - CURRENT_DATE) AS days_until_expiry,
  CASE 
    WHEN b.expiry_date <= CURRENT_DATE THEN '已过期'
    WHEN (b.expiry_date - CURRENT_DATE) <= 30 THEN '即将过期'
    ELSE '正常'
  END AS expiry_status,
  CASE 
    WHEN b.quantity = 0 THEN '无库存'
    WHEN b.quantity < m.safety_stock THEN '库存不足'
    ELSE '库存正常'
  END AS stock_status,
  (
    SELECT COUNT(*) 
    FROM public.inventory_transactions it 
    WHERE it.batch_id = b.id
  ) AS transaction_count
FROM 
  public.batches b
JOIN 
  public.medicines m ON b.medicine_id = m.id;

-- ============================================================================
-- 7. 批次交易历史视图
-- ============================================================================

-- 创建批次交易历史视图
DROP VIEW IF EXISTS public.batch_transaction_history;
CREATE VIEW public.batch_transaction_history AS
SELECT 
  it.id AS transaction_id,
  it.medicine_id,
  m.name AS medicine_name,
  it.batch_id,
  b.batch_number,
  it.type,
  it.quantity,
  it.remaining_quantity,
  it.notes,
  it.created_at AS transaction_date,
  u.name AS user_name,
  u.role AS user_role
FROM 
  public.inventory_transactions it
JOIN 
  public.medicines m ON it.medicine_id = m.id
JOIN 
  public.batches b ON it.batch_id = b.id
JOIN 
  public.users u ON it.user_id = u.id
ORDER BY 
  it.created_at DESC;

-- ============================================================================
-- 8. 药品库存变动统计视图
-- ============================================================================

-- 创建药品库存变动统计视图
DROP VIEW IF EXISTS public.medicine_inventory_changes;
CREATE VIEW public.medicine_inventory_changes AS
WITH daily_changes AS (
  SELECT 
    it.medicine_id,
    DATE_TRUNC('day', it.created_at) AS transaction_date,
    SUM(CASE WHEN it.type = 'inbound' THEN it.quantity ELSE 0 END) AS inbound_quantity,
    SUM(CASE WHEN it.type = 'outbound' THEN it.quantity ELSE 0 END) AS outbound_quantity
  FROM 
    public.inventory_transactions it
  GROUP BY 
    it.medicine_id, DATE_TRUNC('day', it.created_at)
)
SELECT 
  dc.medicine_id,
  m.name AS medicine_name,
  m.barcode,
  dc.transaction_date,
  dc.inbound_quantity,
  dc.outbound_quantity,
  (dc.inbound_quantity - dc.outbound_quantity) AS net_change,
  (
    SELECT COALESCE(SUM(CASE WHEN it.type = 'inbound' THEN it.quantity ELSE -it.quantity END), 0)
    FROM public.inventory_transactions it
    WHERE it.medicine_id = dc.medicine_id
      AND DATE_TRUNC('day', it.created_at) <= dc.transaction_date
  ) AS running_total
FROM 
  daily_changes dc
JOIN 
  public.medicines m ON dc.medicine_id = m.id
ORDER BY 
  dc.transaction_date DESC, m.name;

-- ============================================================================
-- 9. 创建库存交易验证函数
-- ============================================================================

-- 创建入库验证函数
CREATE OR REPLACE FUNCTION public.validate_inbound_transaction(
  p_medicine_id UUID,
  p_batch_number TEXT,
  p_quantity INTEGER
)
RETURNS TABLE (
  is_valid BOOLEAN,
  message TEXT,
  existing_batch_id UUID
) AS $
DECLARE
  existing_batch_id UUID;
BEGIN
  -- 检查药品是否存在
  IF NOT EXISTS (SELECT 1 FROM public.medicines WHERE id = p_medicine_id) THEN
    RETURN QUERY SELECT FALSE, '药品不存在', NULL::UUID;
    RETURN;
  END IF;
  
  -- 检查批次是否已存在
  SELECT id INTO existing_batch_id
  FROM public.batches
  WHERE medicine_id = p_medicine_id AND batch_number = p_batch_number;
  
  -- 检查数量是否有效
  IF p_quantity <= 0 THEN
    RETURN QUERY SELECT FALSE, '入库数量必须大于0', existing_batch_id;
    RETURN;
  END IF;
  
  -- 返回验证结果
  RETURN QUERY SELECT TRUE, '验证通过', existing_batch_id;
END;
$ LANGUAGE plpgsql;

-- 创建出库验证函数
CREATE OR REPLACE FUNCTION public.validate_outbound_transaction(
  p_medicine_id UUID,
  p_batch_id UUID,
  p_quantity INTEGER
)
RETURNS TABLE (
  is_valid BOOLEAN,
  message TEXT,
  available_quantity INTEGER
) AS $
DECLARE
  available_quantity INTEGER;
  medicine_name TEXT;
  batch_number TEXT;
BEGIN
  -- 获取药品和批次信息
  SELECT m.name, b.batch_number, b.quantity 
  INTO medicine_name, batch_number, available_quantity
  FROM public.medicines m
  JOIN public.batches b ON m.id = b.medicine_id
  WHERE b.id = p_batch_id AND m.id = p_medicine_id;
  
  -- 检查药品和批次是否存在
  IF medicine_name IS NULL THEN
    RETURN QUERY SELECT FALSE, '药品或批次不存在', 0;
    RETURN;
  END IF;
  
  -- 检查批次是否过期
  IF EXISTS (
    SELECT 1 FROM public.batches 
    WHERE id = p_batch_id AND expiry_date <= CURRENT_DATE
  ) THEN
    RETURN QUERY SELECT FALSE, '批次已过期，不能出库', available_quantity;
    RETURN;
  END IF;
  
  -- 检查数量是否有效
  IF p_quantity <= 0 THEN
    RETURN QUERY SELECT FALSE, '出库数量必须大于0', available_quantity;
    RETURN;
  END IF;
  
  -- 检查库存是否足够
  IF available_quantity < p_quantity THEN
    RETURN QUERY SELECT FALSE, 
      '库存不足：药品 ' || medicine_name || ' (批次 ' || batch_number || ') 当前库存 ' || 
      available_quantity || '，请求出库 ' || p_quantity, 
      available_quantity;
    RETURN;
  END IF;
  
  -- 返回验证结果
  RETURN QUERY SELECT TRUE, '验证通过', available_quantity;
END;
$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. 创建库存交易报告函数
-- ============================================================================

-- 创建库存交易报告函数
CREATE OR REPLACE FUNCTION public.get_inventory_transaction_report(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_medicine_id UUID DEFAULT NULL,
  p_transaction_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  transaction_date DATE,
  medicine_name TEXT,
  batch_number TEXT,
  transaction_type TEXT,
  quantity INTEGER,
  user_name TEXT,
  notes TEXT
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    DATE(it.created_at) AS transaction_date,
    m.name AS medicine_name,
    b.batch_number,
    it.type AS transaction_type,
    it.quantity,
    u.name AS user_name,
    it.notes
  FROM 
    public.inventory_transactions it
  JOIN 
    public.medicines m ON it.medicine_id = m.id
  JOIN 
    public.batches b ON it.batch_id = b.id
  JOIN 
    public.users u ON it.user_id = u.id
  WHERE 
    (p_start_date IS NULL OR DATE(it.created_at) >= p_start_date) AND
    (p_end_date IS NULL OR DATE(it.created_at) <= p_end_date) AND
    (p_medicine_id IS NULL OR it.medicine_id = p_medicine_id) AND
    (p_transaction_type IS NULL OR it.type = p_transaction_type)
  ORDER BY 
    it.created_at DESC;
END;
$ LANGUAGE plpgsql;

-- ============================================================================
-- 11. 创建库存快照函数
-- ============================================================================

-- 创建库存快照表（如果需要历史记录）
CREATE TABLE IF NOT EXISTS public.inventory_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_date DATE NOT NULL,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id),
  total_quantity INTEGER NOT NULL,
  batch_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_inventory_snapshots_date ON public.inventory_snapshots (snapshot_date);
CREATE INDEX IF NOT EXISTS idx_inventory_snapshots_medicine ON public.inventory_snapshots (medicine_id);

-- 创建库存快照生成函数
CREATE OR REPLACE FUNCTION public.create_inventory_snapshot(snapshot_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $
DECLARE
  inserted_count INTEGER;
BEGIN
  -- 删除同一天的旧快照
  DELETE FROM public.inventory_snapshots
  WHERE snapshot_date = create_inventory_snapshot.snapshot_date;
  
  -- 插入新快照
  INSERT INTO public.inventory_snapshots (
    snapshot_date,
    medicine_id,
    total_quantity,
    batch_count
  )
  SELECT 
    create_inventory_snapshot.snapshot_date,
    m.id,
    COALESCE(SUM(b.quantity), 0),
    COUNT(b.id) FILTER (WHERE b.quantity > 0)
  FROM 
    public.medicines m
  LEFT JOIN 
    public.batches b ON m.id = b.medicine_id AND b.quantity > 0
  GROUP BY 
    m.id;
    
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$ LANGUAGE plpgsql;

-- ============================================================================
-- 12. 创建库存交易测试函数
-- ============================================================================

-- 创建库存交易测试函数
CREATE OR REPLACE FUNCTION public.test_inventory_transactions()
RETURNS TABLE (
  test_name TEXT,
  status TEXT,
  details TEXT
) AS $
DECLARE
  test_medicine_id UUID;
  test_batch_id UUID;
  test_user_id UUID;
  test_result RECORD;
BEGIN
  -- 获取测试数据
  SELECT id INTO test_medicine_id FROM public.medicines LIMIT 1;
  SELECT id INTO test_batch_id FROM public.batches WHERE medicine_id = test_medicine_id LIMIT 1;
  SELECT id INTO test_user_id FROM public.users LIMIT 1;
  
  -- 测试 1: 检查触发器是否正常工作
  BEGIN
    -- 记录原始数量
    SELECT quantity INTO test_result.quantity FROM public.batches WHERE id = test_batch_id;
    
    -- 插入测试入库记录
    INSERT INTO public.inventory_transactions (
      medicine_id, batch_id, user_id, type, quantity, remaining_quantity, notes
    ) VALUES (
      test_medicine_id, test_batch_id, test_user_id, 'inbound', 10, 0, '测试入库'
    );
    
    -- 检查数量是否增加
    IF (SELECT quantity FROM public.batches WHERE id = test_batch_id) = test_result.quantity + 10 THEN
      RETURN QUERY SELECT '入库触发器测试'::TEXT, '通过'::TEXT, '批次数量正确增加'::TEXT;
    ELSE
      RETURN QUERY SELECT '入库触发器测试'::TEXT, '失败'::TEXT, '批次数量未正确增加'::TEXT;
    END IF;
    
    -- 插入测试出库记录
    INSERT INTO public.inventory_transactions (
      medicine_id, batch_id, user_id, type, quantity, remaining_quantity, notes
    ) VALUES (
      test_medicine_id, test_batch_id, test_user_id, 'outbound', 5, 0, '测试出库'
    );
    
    -- 检查数量是否减少
    IF (SELECT quantity FROM public.batches WHERE id = test_batch_id) = test_result.quantity + 5 THEN
      RETURN QUERY SELECT '出库触发器测试'::TEXT, '通过'::TEXT, '批次数量正确减少'::TEXT;
    ELSE
      RETURN QUERY SELECT '出库触发器测试'::TEXT, '失败'::TEXT, '批次数量未正确减少'::TEXT;
    END IF;
    
    -- 恢复原始数量
    UPDATE public.batches SET quantity = test_result.quantity WHERE id = test_batch_id;
    
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT '触发器测试'::TEXT, '失败'::TEXT, '错误: ' || SQLERRM::TEXT;
  END;
  
  -- 测试 2: 检查 FIFO 函数
  BEGIN
    -- 测试 FIFO 出库函数
    PERFORM * FROM public.process_outbound_fifo(test_medicine_id, test_user_id, 1, '测试 FIFO 出库');
    RETURN QUERY SELECT 'FIFO 出库测试'::TEXT, '通过'::TEXT, 'FIFO 函数执行成功'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'FIFO 出库测试'::TEXT, '失败'::TEXT, '错误: ' || SQLERRM::TEXT;
  END;
  
  -- 测试 3: 检查数据完整性验证
  BEGIN
    -- 测试数据完整性验证函数
    PERFORM * FROM public.validate_inventory_integrity();
    RETURN QUERY SELECT '数据完整性验证测试'::TEXT, '通过'::TEXT, '验证函数执行成功'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT '数据完整性验证测试'::TEXT, '失败'::TEXT, '错误: ' || SQLERRM::TEXT;
  END;
END;
$ LANGUAGE plpgsql;