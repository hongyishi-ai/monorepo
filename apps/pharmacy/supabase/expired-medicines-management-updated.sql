-- 过期药品管理功能（更新版）
-- 基于实际 Supabase 数据库同步更新

-- ============================================================================
-- 1. 标记过期批次函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.mark_expired_batches()
RETURNS TABLE(
  batch_id UUID,
  medicine_name TEXT,
  batch_number TEXT,
  expiry_date DATE,
  quantity INTEGER,
  days_expired INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    m.name,
    b.batch_number,
    b.expiry_date,
    b.quantity,
    (CURRENT_DATE - b.expiry_date)::INTEGER as days_expired
  FROM public.batches b
  JOIN public.medicines m ON b.medicine_id = m.id
  WHERE b.expiry_date < CURRENT_DATE
    AND b.quantity > 0
  ORDER BY b.expiry_date;
END;
$function$;

-- ============================================================================
-- 2. 获取即将过期的药品
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_expiring_medicines(
  p_warning_days INTEGER DEFAULT 30
)
RETURNS TABLE(
  medicine_id UUID,
  medicine_name TEXT,
  batch_id UUID,
  batch_number TEXT,
  quantity INTEGER,
  expiry_date DATE,
  days_until_expiry INTEGER,
  urgency_level TEXT,
  recommended_action TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.name,
    b.id,
    b.batch_number,
    b.quantity,
    b.expiry_date,
    (b.expiry_date - CURRENT_DATE)::INTEGER as days_until_expiry,
    CASE 
      WHEN b.expiry_date < CURRENT_DATE THEN '已过期'
      WHEN b.expiry_date <= CURRENT_DATE + 7 THEN '紧急'
      WHEN b.expiry_date <= CURRENT_DATE + 30 THEN '警告'
      ELSE '正常'
    END::TEXT as urgency_level,
    CASE 
      WHEN b.expiry_date < CURRENT_DATE THEN '立即处理过期药品'
      WHEN b.expiry_date <= CURRENT_DATE + 7 THEN '7天内到期，优先使用'
      WHEN b.expiry_date <= CURRENT_DATE + 30 THEN '30天内到期，注意使用顺序'
      ELSE '正常库存'
    END::TEXT as recommended_action
  FROM public.medicines m
  JOIN public.batches b ON m.id = b.medicine_id
  WHERE b.quantity > 0
    AND b.expiry_date <= CURRENT_DATE + p_warning_days
  ORDER BY b.expiry_date ASC, m.name ASC;
END;
$function$;

-- ============================================================================
-- 3. 过期药品处理函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_expired_medicine(
  p_batch_id UUID,
  p_action_type TEXT, -- 'dispose', 'return', 'transfer'
  p_quantity INTEGER,
  p_user_id UUID,
  p_notes TEXT DEFAULT NULL,
  p_disposal_method TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_batch RECORD;
  v_medicine RECORD;
  v_transaction_id UUID;
  v_action_id UUID;
BEGIN
  -- 验证输入参数
  IF p_action_type NOT IN ('dispose', 'return', 'transfer') THEN
    RETURN json_build_object(
      'success', false,
      'error', '无效的处理类型'
    );
  END IF;
  
  IF p_quantity <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', '处理数量必须大于0'
    );
  END IF;
  
  -- 获取批次信息
  SELECT * INTO v_batch FROM public.batches WHERE id = p_batch_id;
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', '批次不存在'
    );
  END IF;
  
  -- 获取药品信息
  SELECT * INTO v_medicine FROM public.medicines WHERE id = v_batch.medicine_id;
  
  -- 检查库存是否足够
  IF v_batch.quantity < p_quantity THEN
    RETURN json_build_object(
      'success', false,
      'error', '库存不足',
      'available_quantity', v_batch.quantity,
      'requested_quantity', p_quantity
    );
  END IF;
  
  -- 检查是否真的过期
  IF v_batch.expiry_date >= CURRENT_DATE THEN
    RETURN json_build_object(
      'success', false,
      'error', '该批次尚未过期',
      'expiry_date', v_batch.expiry_date,
      'current_date', CURRENT_DATE
    );
  END IF;
  
  -- 创建库存交易记录
  INSERT INTO public.inventory_transactions (
    medicine_id,
    batch_id,
    type,
    quantity,
    user_id,
    notes,
    reference_number
  ) VALUES (
    v_batch.medicine_id,
    p_batch_id,
    'expired',
    p_quantity,
    p_user_id,
    COALESCE(p_notes, '过期药品处理: ' || p_action_type),
    'EXPIRED_' || p_batch_id::TEXT || '_' || extract(epoch from now())::TEXT
  ) RETURNING id INTO v_transaction_id;
  
  -- 更新批次库存
  UPDATE public.batches 
  SET 
    quantity = quantity - p_quantity,
    updated_at = NOW()
  WHERE id = p_batch_id;
  
  -- 创建过期药品处理记录（如果表存在）
  BEGIN
    INSERT INTO public.expired_medicine_actions (
      batch_id,
      medicine_id,
      action_type,
      quantity,
      disposal_method,
      handled_by,
      handled_at,
      notes,
      transaction_id
    ) VALUES (
      p_batch_id,
      v_batch.medicine_id,
      p_action_type,
      p_quantity,
      p_disposal_method,
      p_user_id,
      NOW(),
      p_notes,
      v_transaction_id
    ) RETURNING id INTO v_action_id;
  EXCEPTION WHEN undefined_table THEN
    -- 如果表不存在，继续执行，不影响主要功能
    v_action_id := NULL;
  END;
  
  RETURN json_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'action_id', v_action_id,
    'processed_quantity', p_quantity,
    'remaining_quantity', v_batch.quantity - p_quantity,
    'medicine_name', v_medicine.name,
    'batch_number', v_batch.batch_number,
    'action_type', p_action_type
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', '处理过期药品失败: ' || SQLERRM
    );
END;
$function$;

-- ============================================================================
-- 4. 过期药品统计函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_expired_medicine_stats(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'period', json_build_object(
      'start_date', p_start_date,
      'end_date', p_end_date
    ),
    'expired_batches', json_build_object(
      'total_count', COUNT(DISTINCT b.id),
      'total_quantity', COALESCE(SUM(b.quantity), 0),
      'unique_medicines', COUNT(DISTINCT b.medicine_id)
    ),
    'processed_expired', json_build_object(
      'total_transactions', COUNT(DISTINCT it.id),
      'total_processed_quantity', COALESCE(SUM(it.quantity), 0)
    ),
    'by_medicine', json_agg(
      DISTINCT json_build_object(
        'medicine_name', m.name,
        'expired_quantity', medicine_stats.expired_qty,
        'processed_quantity', medicine_stats.processed_qty,
        'remaining_expired', medicine_stats.expired_qty - COALESCE(medicine_stats.processed_qty, 0)
      )
    ) FILTER (WHERE m.id IS NOT NULL)
  ) INTO v_stats
  FROM public.batches b
  JOIN public.medicines m ON b.medicine_id = m.id
  LEFT JOIN (
    SELECT 
      b2.medicine_id,
      SUM(b2.quantity) as expired_qty,
      SUM(it2.quantity) as processed_qty
    FROM public.batches b2
    LEFT JOIN public.inventory_transactions it2 ON b2.id = it2.batch_id 
      AND it2.type = 'expired'
      AND it2.created_at::DATE BETWEEN p_start_date AND p_end_date
    WHERE b2.expiry_date < CURRENT_DATE
      AND b2.expiry_date >= p_start_date
    GROUP BY b2.medicine_id
  ) medicine_stats ON m.id = medicine_stats.medicine_id
  LEFT JOIN public.inventory_transactions it ON b.id = it.batch_id 
    AND it.type = 'expired'
    AND it.created_at::DATE BETWEEN p_start_date AND p_end_date
  WHERE b.expiry_date < CURRENT_DATE
    AND b.expiry_date >= p_start_date;
  
  RETURN COALESCE(v_stats, json_build_object(
    'period', json_build_object('start_date', p_start_date, 'end_date', p_end_date),
    'expired_batches', json_build_object('total_count', 0, 'total_quantity', 0, 'unique_medicines', 0),
    'processed_expired', json_build_object('total_transactions', 0, 'total_processed_quantity', 0),
    'by_medicine', '[]'::json
  ));
END;
$function$;

-- ============================================================================
-- 5. 过期预警设置函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_expiry_warning_settings(
  p_warning_days INTEGER,
  p_critical_days INTEGER DEFAULT 7,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_current_user_id UUID;
  v_user_role TEXT;
BEGIN
  -- 获取当前用户
  v_current_user_id := COALESCE(p_user_id, auth.uid());
  
  IF v_current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', '用户未认证'
    );
  END IF;
  
  -- 检查用户权限
  SELECT role INTO v_user_role FROM public.users WHERE id = v_current_user_id;
  
  IF v_user_role NOT IN ('admin', 'manager') THEN
    RETURN json_build_object(
      'success', false,
      'error', '权限不足，只有管理员和经理可以修改预警设置'
    );
  END IF;
  
  -- 验证参数
  IF p_warning_days <= 0 OR p_critical_days <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', '预警天数必须大于0'
    );
  END IF;
  
  IF p_critical_days >= p_warning_days THEN
    RETURN json_build_object(
      'success', false,
      'error', '紧急预警天数必须小于普通预警天数'
    );
  END IF;
  
  -- 更新系统设置
  INSERT INTO public.system_settings (key, value, description, updated_by)
  VALUES 
    ('expiry_warning_days', p_warning_days::TEXT, '过期预警天数', v_current_user_id),
    ('expiry_critical_days', p_critical_days::TEXT, '过期紧急预警天数', v_current_user_id)
  ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW(),
    updated_by = EXCLUDED.updated_by;
  
  RETURN json_build_object(
    'success', true,
    'warning_days', p_warning_days,
    'critical_days', p_critical_days,
    'updated_by', v_current_user_id,
    'updated_at', NOW()
  );
END;
$function$;

-- ============================================================================
-- 6. 过期药品批量处理函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.batch_handle_expired_medicines(
  p_batch_ids UUID[],
  p_action_type TEXT,
  p_user_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_batch_id UUID;
  v_result JSON;
  v_success_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_results JSON[] := '{}';
  v_total_processed INTEGER := 0;
BEGIN
  -- 验证输入
  IF array_length(p_batch_ids, 1) IS NULL OR array_length(p_batch_ids, 1) = 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', '批次列表不能为空'
    );
  END IF;
  
  -- 逐个处理批次
  FOREACH v_batch_id IN ARRAY p_batch_ids
  LOOP
    -- 获取批次数量并处理
    SELECT 
      public.handle_expired_medicine(
        v_batch_id,
        p_action_type,
        b.quantity, -- 处理全部数量
        p_user_id,
        p_notes
      ) INTO v_result
    FROM public.batches b
    WHERE b.id = v_batch_id;
    
    -- 统计结果
    IF (v_result->>'success')::BOOLEAN THEN
      v_success_count := v_success_count + 1;
      v_total_processed := v_total_processed + (v_result->>'processed_quantity')::INTEGER;
    ELSE
      v_error_count := v_error_count + 1;
    END IF;
    
    -- 收集详细结果
    v_results := v_results || json_build_object(
      'batch_id', v_batch_id,
      'result', v_result
    );
  END LOOP;
  
  RETURN json_build_object(
    'success', v_error_count = 0,
    'summary', json_build_object(
      'total_batches', array_length(p_batch_ids, 1),
      'success_count', v_success_count,
      'error_count', v_error_count,
      'total_processed_quantity', v_total_processed
    ),
    'detailed_results', v_results,
    'action_type', p_action_type,
    'processed_by', p_user_id,
    'processed_at', NOW()
  );
END;
$function$;

-- ============================================================================
-- 7. 过期药品报告生成函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_expiry_report(
  p_report_type TEXT DEFAULT 'summary', -- 'summary', 'detailed', 'by_medicine'
  p_include_processed BOOLEAN DEFAULT false
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_report JSON;
  v_expired_count INTEGER;
  v_expiring_count INTEGER;
BEGIN
  -- 统计基本数据
  SELECT COUNT(*) INTO v_expired_count
  FROM public.batches b
  WHERE b.expiry_date < CURRENT_DATE AND b.quantity > 0;
  
  SELECT COUNT(*) INTO v_expiring_count
  FROM public.batches b
  WHERE b.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
    AND b.quantity > 0;
  
  -- 根据报告类型生成不同详细程度的报告
  CASE p_report_type
    WHEN 'summary' THEN
      v_report := json_build_object(
        'report_type', 'summary',
        'generated_at', NOW(),
        'summary', json_build_object(
          'expired_batches', v_expired_count,
          'expiring_soon_batches', v_expiring_count,
          'total_risk_batches', v_expired_count + v_expiring_count
        )
      );
    
    WHEN 'detailed' THEN
      SELECT json_build_object(
        'report_type', 'detailed',
        'generated_at', NOW(),
        'summary', json_build_object(
          'expired_batches', v_expired_count,
          'expiring_soon_batches', v_expiring_count
        ),
        'expired_medicines', (
          SELECT json_agg(
            json_build_object(
              'medicine_name', medicine_name,
              'batch_number', batch_number,
              'quantity', quantity,
              'expiry_date', expiry_date,
              'days_expired', days_expired
            )
          )
          FROM public.mark_expired_batches()
        ),
        'expiring_medicines', (
          SELECT json_agg(
            json_build_object(
              'medicine_name', medicine_name,
              'batch_number', batch_number,
              'quantity', quantity,
              'expiry_date', expiry_date,
              'days_until_expiry', days_until_expiry,
              'urgency_level', urgency_level
            )
          )
          FROM public.get_expiring_medicines(30)
          WHERE days_until_expiry > 0
        )
      ) INTO v_report;
    
    WHEN 'by_medicine' THEN
      SELECT json_build_object(
        'report_type', 'by_medicine',
        'generated_at', NOW(),
        'medicines', json_agg(
          json_build_object(
            'medicine_name', m.name,
            'medicine_id', m.id,
            'expired_batches', medicine_data.expired_batches,
            'expiring_batches', medicine_data.expiring_batches,
            'total_expired_quantity', medicine_data.expired_qty,
            'total_expiring_quantity', medicine_data.expiring_qty
          )
        )
      ) INTO v_report
      FROM public.medicines m
      JOIN (
        SELECT 
          b.medicine_id,
          COUNT(*) FILTER (WHERE b.expiry_date < CURRENT_DATE AND b.quantity > 0) as expired_batches,
          COUNT(*) FILTER (WHERE b.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30 AND b.quantity > 0) as expiring_batches,
          SUM(b.quantity) FILTER (WHERE b.expiry_date < CURRENT_DATE) as expired_qty,
          SUM(b.quantity) FILTER (WHERE b.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30) as expiring_qty
        FROM public.batches b
        GROUP BY b.medicine_id
        HAVING COUNT(*) FILTER (WHERE b.expiry_date <= CURRENT_DATE + 30 AND b.quantity > 0) > 0
      ) medicine_data ON m.id = medicine_data.medicine_id;
    
    ELSE
      v_report := json_build_object(
        'error', '无效的报告类型',
        'valid_types', json_build_array('summary', 'detailed', 'by_medicine')
      );
  END CASE;
  
  RETURN v_report;
END;
$function$;

-- ============================================================================
-- 8. 过期药品自动处理任务
-- ============================================================================

CREATE OR REPLACE FUNCTION public.auto_process_expired_medicines()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_system_user_id UUID;
  v_auto_process_enabled BOOLEAN;
  v_auto_process_days INTEGER;
  v_processed_count INTEGER := 0;
  v_batch_record RECORD;
BEGIN
  -- 检查是否启用自动处理
  SELECT value::BOOLEAN INTO v_auto_process_enabled
  FROM public.system_settings
  WHERE key = 'auto_process_expired_medicines';
  
  IF NOT COALESCE(v_auto_process_enabled, false) THEN
    RETURN json_build_object(
      'success', false,
      'message', '自动处理过期药品功能未启用'
    );
  END IF;
  
  -- 获取自动处理的天数阈值
  SELECT value::INTEGER INTO v_auto_process_days
  FROM public.system_settings
  WHERE key = 'auto_process_expired_days';
  
  v_auto_process_days := COALESCE(v_auto_process_days, 7); -- 默认7天
  
  -- 获取系统用户ID（用于自动操作）
  SELECT id INTO v_system_user_id
  FROM public.users
  WHERE email = 'system@pharmacy.local'
  LIMIT 1;
  
  IF v_system_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', '系统用户不存在，无法执行自动处理'
    );
  END IF;
  
  -- 处理过期超过指定天数的药品
  FOR v_batch_record IN
    SELECT b.id, b.quantity, m.name as medicine_name, b.batch_number
    FROM public.batches b
    JOIN public.medicines m ON b.medicine_id = m.id
    WHERE b.expiry_date < CURRENT_DATE - v_auto_process_days
      AND b.quantity > 0
  LOOP
    -- 自动标记为已处理（销毁）
    PERFORM public.handle_expired_medicine(
      v_batch_record.id,
      'dispose',
      v_batch_record.quantity,
      v_system_user_id,
      '系统自动处理过期药品',
      'auto_disposal'
    );
    
    v_processed_count := v_processed_count + 1;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'processed_count', v_processed_count,
    'auto_process_days', v_auto_process_days,
    'processed_at', NOW(),
    'processed_by', 'system'
  );
END;
$function$;

-- ============================================================================
-- 9. 创建过期药品处理表（如果不存在）
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.expired_medicine_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.batches(id),
  medicine_id UUID NOT NULL REFERENCES public.medicines(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('dispose', 'return', 'transfer')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  disposal_method TEXT,
  handled_by UUID NOT NULL REFERENCES public.users(id),
  handled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  notes TEXT,
  transaction_id UUID REFERENCES public.inventory_transactions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_expired_medicine_actions_batch_id 
ON public.expired_medicine_actions(batch_id);

CREATE INDEX IF NOT EXISTS idx_expired_medicine_actions_medicine_id 
ON public.expired_medicine_actions(medicine_id);

CREATE INDEX IF NOT EXISTS idx_expired_medicine_actions_handled_at 
ON public.expired_medicine_actions(handled_at);

-- 启用RLS
ALTER TABLE public.expired_medicine_actions ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "All authenticated users can view expired medicine actions" 
ON public.expired_medicine_actions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "All authenticated users can create expired medicine actions" 
ON public.expired_medicine_actions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================================================
-- 10. 过期药品处理触发器
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_expired_medicine_actions_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 创建触发器
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'trigger_update_expired_medicine_actions_timestamp'
  ) THEN
    CREATE TRIGGER trigger_update_expired_medicine_actions_timestamp
      BEFORE UPDATE ON public.expired_medicine_actions
      FOR EACH ROW
      EXECUTE FUNCTION public.update_expired_medicine_actions_timestamp();
  END IF;
END $$;