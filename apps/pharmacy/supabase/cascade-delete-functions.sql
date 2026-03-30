-- 级联删除函数
-- 解决删除药品和批次时的外键约束问题

-- 创建级联删除药品的函数
CREATE OR REPLACE FUNCTION cascade_delete_medicine(medicine_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  transaction_count INTEGER;
  batch_count INTEGER;
BEGIN
  -- 检查是否有库存交易记录
  SELECT COUNT(*) INTO transaction_count
  FROM inventory_transactions
  WHERE medicine_id = medicine_id_param;
  
  -- 检查是否有批次记录
  SELECT COUNT(*) INTO batch_count
  FROM batches
  WHERE medicine_id = medicine_id_param;
  
  -- 记录删除操作
  RAISE NOTICE '准备删除药品 %, 关联交易记录: %, 关联批次: %', 
    medicine_id_param, transaction_count, batch_count;
  
  -- 删除库存交易记录
  DELETE FROM inventory_transactions WHERE medicine_id = medicine_id_param;
  
  -- 删除批次记录
  DELETE FROM batches WHERE medicine_id = medicine_id_param;
  
  -- 删除药品记录
  DELETE FROM medicines WHERE id = medicine_id_param;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '删除药品失败: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建级联删除批次的函数
CREATE OR REPLACE FUNCTION cascade_delete_batch(batch_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  transaction_count INTEGER;
BEGIN
  -- 检查是否有库存交易记录
  SELECT COUNT(*) INTO transaction_count
  FROM inventory_transactions
  WHERE batch_id = batch_id_param;
  
  -- 记录删除操作
  RAISE NOTICE '准备删除批次 %, 关联交易记录: %', 
    batch_id_param, transaction_count;
  
  -- 删除库存交易记录
  DELETE FROM inventory_transactions WHERE batch_id = batch_id_param;
  
  -- 删除批次记录
  DELETE FROM batches WHERE id = batch_id_param;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '删除批次失败: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建安全删除药品的函数（带确认）
CREATE OR REPLACE FUNCTION safe_delete_medicine(
  medicine_id_param UUID,
  confirm_delete BOOLEAN DEFAULT FALSE
)
RETURNS JSON AS $$
DECLARE
  medicine_info RECORD;
  transaction_count INTEGER;
  batch_count INTEGER;
  result JSON;
BEGIN
  -- 获取药品信息
  SELECT * INTO medicine_info FROM medicines WHERE id = medicine_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', '药品不存在'
    );
  END IF;
  
  -- 统计关联数据
  SELECT COUNT(*) INTO transaction_count
  FROM inventory_transactions
  WHERE medicine_id = medicine_id_param;
  
  SELECT COUNT(*) INTO batch_count
  FROM batches
  WHERE medicine_id = medicine_id_param;
  
  -- 如果没有确认删除，返回警告信息
  IF NOT confirm_delete AND (transaction_count > 0 OR batch_count > 0) THEN
    RETURN json_build_object(
      'success', false,
      'warning', true,
      'message', format('该药品有 %s 条库存交易记录和 %s 个批次，删除将同时删除这些数据', 
                       transaction_count, batch_count),
      'medicine_name', medicine_info.name,
      'transaction_count', transaction_count,
      'batch_count', batch_count
    );
  END IF;
  
  -- 执行级联删除
  PERFORM cascade_delete_medicine(medicine_id_param);
  
  RETURN json_build_object(
    'success', true,
    'message', '药品删除成功',
    'deleted_transactions', transaction_count,
    'deleted_batches', batch_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建安全删除批次的函数（带确认）
CREATE OR REPLACE FUNCTION safe_delete_batch(
  batch_id_param UUID,
  confirm_delete BOOLEAN DEFAULT FALSE
)
RETURNS JSON AS $$
DECLARE
  batch_info RECORD;
  transaction_count INTEGER;
  result JSON;
BEGIN
  -- 获取批次信息
  SELECT b.*, m.name as medicine_name 
  INTO batch_info 
  FROM batches b
  JOIN medicines m ON b.medicine_id = m.id
  WHERE b.id = batch_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', '批次不存在'
    );
  END IF;
  
  -- 统计关联数据
  SELECT COUNT(*) INTO transaction_count
  FROM inventory_transactions
  WHERE batch_id = batch_id_param;
  
  -- 如果没有确认删除，返回警告信息
  IF NOT confirm_delete AND transaction_count > 0 THEN
    RETURN json_build_object(
      'success', false,
      'warning', true,
      'message', format('该批次有 %s 条库存交易记录，删除将同时删除这些数据', transaction_count),
      'medicine_name', batch_info.medicine_name,
      'batch_number', batch_info.batch_number,
      'transaction_count', transaction_count
    );
  END IF;
  
  -- 执行级联删除
  PERFORM cascade_delete_batch(batch_id_param);
  
  RETURN json_build_object(
    'success', true,
    'message', '批次删除成功',
    'deleted_transactions', transaction_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建查询关联数据的函数
CREATE OR REPLACE FUNCTION get_medicine_dependencies(medicine_id_param UUID)
RETURNS JSON AS $$
DECLARE
  medicine_info RECORD;
  transaction_count INTEGER;
  batch_count INTEGER;
  recent_transactions RECORD;
BEGIN
  -- 获取药品信息
  SELECT * INTO medicine_info FROM medicines WHERE id = medicine_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', '药品不存在'
    );
  END IF;
  
  -- 统计关联数据
  SELECT COUNT(*) INTO transaction_count
  FROM inventory_transactions
  WHERE medicine_id = medicine_id_param;
  
  SELECT COUNT(*) INTO batch_count
  FROM batches
  WHERE medicine_id = medicine_id_param;
  
  RETURN json_build_object(
    'success', true,
    'medicine_name', medicine_info.name,
    'medicine_barcode', medicine_info.barcode,
    'transaction_count', transaction_count,
    'batch_count', batch_count,
    'can_delete', (transaction_count = 0 AND batch_count = 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建查询批次关联数据的函数
CREATE OR REPLACE FUNCTION get_batch_dependencies(batch_id_param UUID)
RETURNS JSON AS $$
DECLARE
  batch_info RECORD;
  transaction_count INTEGER;
BEGIN
  -- 获取批次信息
  SELECT b.*, m.name as medicine_name 
  INTO batch_info 
  FROM batches b
  JOIN medicines m ON b.medicine_id = m.id
  WHERE b.id = batch_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', '批次不存在'
    );
  END IF;
  
  -- 统计关联数据
  SELECT COUNT(*) INTO transaction_count
  FROM inventory_transactions
  WHERE batch_id = batch_id_param;
  
  RETURN json_build_object(
    'success', true,
    'medicine_name', batch_info.medicine_name,
    'batch_number', batch_info.batch_number,
    'transaction_count', transaction_count,
    'can_delete', (transaction_count = 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;