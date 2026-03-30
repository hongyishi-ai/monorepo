-- 修复：撤回出库时未写入 remaining_quantity 导致 NOT NULL 约束报错
-- 方案：统一通过 process_inventory_transaction 执行撤回入库，
--       由过程计算并写入 remaining_quantity，且原子更新批次数量。

CREATE OR REPLACE FUNCTION public.undo_outbound_transaction(
  p_transaction_id UUID,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_undoable RECORD;
  v_transaction RECORD;
  v_batch RECORD;
  v_undo_transaction_id UUID;
  v_result JSON;
  v_new_batch_quantity INTEGER;
BEGIN
  -- 获取可撤回交易记录
  SELECT * INTO v_undoable 
  FROM public.undoable_transactions 
  WHERE transaction_id = p_transaction_id 
    AND is_undone = FALSE 
    AND undo_deadline > NOW();
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', '交易不可撤回或已过期'
    );
  END IF;
  
  -- 获取原始交易记录
  SELECT * INTO v_transaction 
  FROM public.inventory_transactions 
  WHERE id = p_transaction_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', '原始交易记录不存在'
    );
  END IF;
  
  -- 获取批次信息
  SELECT * INTO v_batch FROM public.batches WHERE id = v_transaction.batch_id;
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', '批次不存在'
    );
  END IF;
  
  -- 通过统一过程执行入库以保证 remaining_quantity 正确写入并原子更新批次
  v_result := public.process_inventory_transaction(
    v_transaction.medicine_id,
    v_transaction.batch_id,
    'inbound',
    v_transaction.quantity,
    p_user_id,
    '撤回交易ID: ' || p_transaction_id,
    'UNDO_' || p_transaction_id::TEXT
  );

  IF COALESCE((v_result ->> 'success')::BOOLEAN, false) IS NOT TRUE THEN
    RETURN json_build_object(
      'success', false,
      'error', COALESCE(v_result ->> 'error', '撤回交易失败：入库处理失败')
    );
  END IF;

  v_undo_transaction_id := (v_result ->> 'transaction_id')::UUID;
  v_new_batch_quantity := (v_result ->> 'new_quantity')::INTEGER;

  -- 标记为已撤回
  UPDATE public.undoable_transactions 
  SET 
    is_undone = TRUE,
    undone_at = NOW(),
    undone_by = p_user_id,
    undo_transaction_id = v_undo_transaction_id
  WHERE id = v_undoable.id;
  
  RETURN json_build_object(
    'success', true,
    'undo_transaction_id', v_undo_transaction_id,
    'original_transaction_id', p_transaction_id,
    'restored_quantity', v_transaction.quantity,
    'new_batch_quantity', v_new_batch_quantity
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', '撤回交易失败: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_catalog';


