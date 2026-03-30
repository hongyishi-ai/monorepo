-- 系统设置管理功能
-- 基于实际 Supabase 数据库同步更新

-- ============================================================================
-- 1. 系统设置管理权限检查
-- ============================================================================

CREATE OR REPLACE FUNCTION public.can_manage_system_settings()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  user_role text;
  current_user_id UUID;
  jwt_role text;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  jwt_role := (select auth.jwt() -> 'user_metadata' ->> 'role');
  
  IF jwt_role = 'admin' THEN
    RETURN true;
  END IF;
  
  jwt_role := (select auth.jwt() -> 'app_metadata' ->> 'role');
  
  IF jwt_role = 'admin' THEN
    RETURN true;
  END IF;
  
  SELECT role INTO user_role 
  FROM public.users 
  WHERE id = current_user_id;
  
  RETURN user_role = 'admin';
END;
$function$;

-- ============================================================================
-- 2. 安全初始化系统设置
-- ============================================================================

CREATE OR REPLACE FUNCTION public.safe_initialize_system_settings()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  current_user_role TEXT;
  settings_count INTEGER;
BEGIN
  current_user_role := get_current_user_role();
  
  IF current_user_role IS NULL THEN
    RAISE NOTICE 'User not authenticated';
    RETURN FALSE;
  END IF;
  
  IF current_user_role != 'admin' THEN
    RAISE NOTICE 'User is not admin: %', current_user_role;
    RETURN FALSE;
  END IF;
  
  SELECT COUNT(*) INTO settings_count FROM public.system_settings;
  
  IF settings_count > 0 THEN
    RAISE NOTICE 'System settings already initialized';
    RETURN TRUE;
  END IF;
  
  INSERT INTO public.system_settings (key, value, description) VALUES
    ('expiry_warning_days', '30', '近效期提醒天数'),
    ('session_timeout', '28800', '会话超时时间（秒）'),
    ('auto_refresh_session', 'true', '是否自动刷新会话'),
    ('password_min_length', '8', '密码最小长度'),
    ('require_email_verification', 'true', '是否需要邮箱验证'),
    ('allow_self_registration', 'false', '是否允许自注册'),
    ('default_user_role', 'operator', '默认用户角色')
  ON CONFLICT (key) DO NOTHING;
  
  RAISE NOTICE 'System settings initialized successfully';
  RETURN TRUE;
END;
$function$;

-- ============================================================================
-- 3. 获取系统设置
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_system_setting(
  p_key TEXT,
  p_default_value TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_value TEXT;
BEGIN
  SELECT value INTO v_value
  FROM public.system_settings
  WHERE key = p_key;
  
  RETURN COALESCE(v_value, p_default_value);
END;
$function$;

-- ============================================================================
-- 4. 更新系统设置
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_system_setting(
  p_key TEXT,
  p_value TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_user_id UUID;
  v_old_value TEXT;
BEGIN
  -- 检查权限
  IF NOT public.can_manage_system_settings() THEN
    RETURN json_build_object(
      'success', false,
      'error', '权限不足，只有管理员可以修改系统设置'
    );
  END IF;
  
  v_user_id := auth.uid();
  
  -- 获取旧值
  SELECT value INTO v_old_value
  FROM public.system_settings
  WHERE key = p_key;
  
  -- 更新或插入设置
  INSERT INTO public.system_settings (key, value, description, updated_by)
  VALUES (p_key, p_value, COALESCE(p_description, ''), v_user_id)
  ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = COALESCE(EXCLUDED.description, system_settings.description),
    updated_at = NOW(),
    updated_by = EXCLUDED.updated_by;
  
  -- 记录审计日志
  PERFORM public.log_audit_action(
    v_user_id,
    'system_setting_updated',
    'system_settings',
    gen_random_uuid(),
    jsonb_build_object('key', p_key, 'old_value', v_old_value),
    jsonb_build_object('key', p_key, 'new_value', p_value)
  );
  
  RETURN json_build_object(
    'success', true,
    'key', p_key,
    'old_value', v_old_value,
    'new_value', p_value,
    'updated_by', v_user_id,
    'updated_at', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', '更新系统设置失败: ' || SQLERRM
    );
END;
$function$;

-- ============================================================================
-- 5. 批量更新系统设置
-- ============================================================================

CREATE OR REPLACE FUNCTION public.batch_update_system_settings(
  p_settings JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_user_id UUID;
  v_setting RECORD;
  v_success_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_results JSON[] := '{}';
  v_result JSON;
BEGIN
  -- 检查权限
  IF NOT public.can_manage_system_settings() THEN
    RETURN json_build_object(
      'success', false,
      'error', '权限不足，只有管理员可以修改系统设置'
    );
  END IF;
  
  v_user_id := auth.uid();
  
  -- 遍历设置项
  FOR v_setting IN
    SELECT 
      key,
      value,
      COALESCE(description, '') as description
    FROM jsonb_to_recordset(p_settings) AS x(key TEXT, value TEXT, description TEXT)
  LOOP
    BEGIN
      -- 更新单个设置
      SELECT public.update_system_setting(
        v_setting.key,
        v_setting.value,
        v_setting.description
      ) INTO v_result;
      
      IF (v_result->>'success')::BOOLEAN THEN
        v_success_count := v_success_count + 1;
      ELSE
        v_error_count := v_error_count + 1;
      END IF;
      
      v_results := v_results || v_result;
      
    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      v_results := v_results || json_build_object(
        'success', false,
        'key', v_setting.key,
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  RETURN json_build_object(
    'success', v_error_count = 0,
    'summary', json_build_object(
      'total_settings', v_success_count + v_error_count,
      'success_count', v_success_count,
      'error_count', v_error_count
    ),
    'results', v_results,
    'updated_by', v_user_id,
    'updated_at', NOW()
  );
END;
$function$;

-- ============================================================================
-- 6. 获取所有系统设置
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_all_system_settings()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_settings JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'key', key,
      'value', value,
      'description', description,
      'created_at', created_at,
      'updated_at', updated_at,
      'updated_by', updated_by
    )
  ) INTO v_settings
  FROM public.system_settings
  ORDER BY key;
  
  RETURN COALESCE(v_settings, '[]'::json);
END;
$function$;

-- ============================================================================
-- 7. 重置系统设置为默认值
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reset_system_settings_to_default()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_user_id UUID;
  v_reset_count INTEGER;
BEGIN
  -- 检查权限
  IF NOT public.can_manage_system_settings() THEN
    RETURN json_build_object(
      'success', false,
      'error', '权限不足，只有管理员可以重置系统设置'
    );
  END IF;
  
  v_user_id := auth.uid();
  
  -- 删除所有现有设置
  DELETE FROM public.system_settings;
  
  -- 重新初始化默认设置
  INSERT INTO public.system_settings (key, value, description, updated_by) VALUES
    ('expiry_warning_days', '30', '近效期提醒天数', v_user_id),
    ('expiry_critical_days', '7', '过期紧急预警天数', v_user_id),
    ('session_timeout', '28800', '会话超时时间（秒）', v_user_id),
    ('auto_refresh_session', 'true', '是否自动刷新会话', v_user_id),
    ('password_min_length', '8', '密码最小长度', v_user_id),
    ('require_email_verification', 'true', '是否需要邮箱验证', v_user_id),
    ('allow_self_registration', 'false', '是否允许自注册', v_user_id),
    ('default_user_role', 'operator', '默认用户角色', v_user_id),
    ('auto_process_expired_medicines', 'false', '是否自动处理过期药品', v_user_id),
    ('auto_process_expired_days', '7', '自动处理过期药品的天数阈值', v_user_id),
    ('low_stock_warning_enabled', 'true', '是否启用库存不足预警', v_user_id),
    ('backup_retention_days', '30', '备份保留天数', v_user_id);
  
  GET DIAGNOSTICS v_reset_count = ROW_COUNT;
  
  -- 记录审计日志
  PERFORM public.log_audit_action(
    v_user_id,
    'system_settings_reset',
    'system_settings',
    gen_random_uuid(),
    NULL,
    jsonb_build_object('reset_count', v_reset_count)
  );
  
  RETURN json_build_object(
    'success', true,
    'reset_count', v_reset_count,
    'reset_by', v_user_id,
    'reset_at', NOW(),
    'message', '系统设置已重置为默认值'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', '重置系统设置失败: ' || SQLERRM
    );
END;
$function$;

-- ============================================================================
-- 8. 系统设置验证函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_system_setting(
  p_key TEXT,
  p_value TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- 根据设置键进行特定验证
  CASE p_key
    WHEN 'expiry_warning_days', 'expiry_critical_days', 'session_timeout', 'password_min_length', 'auto_process_expired_days', 'backup_retention_days' THEN
      -- 数值类型验证
      IF p_value !~ '^\d+$' OR p_value::INTEGER <= 0 THEN
        RETURN json_build_object(
          'valid', false,
          'error', '该设置项必须是大于0的整数'
        );
      END IF;
      
      -- 特定范围验证
      IF p_key = 'password_min_length' AND p_value::INTEGER < 6 THEN
        RETURN json_build_object(
          'valid', false,
          'error', '密码最小长度不能少于6位'
        );
      END IF;
      
      IF p_key = 'expiry_warning_days' AND p_value::INTEGER > 365 THEN
        RETURN json_build_object(
          'valid', false,
          'error', '过期预警天数不能超过365天'
        );
      END IF;
    
    WHEN 'auto_refresh_session', 'require_email_verification', 'allow_self_registration', 'auto_process_expired_medicines', 'low_stock_warning_enabled' THEN
      -- 布尔类型验证
      IF p_value NOT IN ('true', 'false') THEN
        RETURN json_build_object(
          'valid', false,
          'error', '该设置项必须是 true 或 false'
        );
      END IF;
    
    WHEN 'default_user_role' THEN
      -- 角色验证
      IF p_value NOT IN ('admin', 'manager', 'operator') THEN
        RETURN json_build_object(
          'valid', false,
          'error', '默认用户角色必须是 admin、manager 或 operator'
        );
      END IF;
    
    ELSE
      -- 未知设置项的通用验证
      IF LENGTH(p_value) > 1000 THEN
        RETURN json_build_object(
          'valid', false,
          'error', '设置值长度不能超过1000个字符'
        );
      END IF;
  END CASE;
  
  RETURN json_build_object(
    'valid', true,
    'message', '设置值验证通过'
  );
END;
$function$;

-- ============================================================================
-- 9. 系统设置导入导出函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.export_system_settings()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_settings JSON;
BEGIN
  -- 检查权限
  IF NOT public.can_manage_system_settings() THEN
    RETURN json_build_object(
      'success', false,
      'error', '权限不足，只有管理员可以导出系统设置'
    );
  END IF;
  
  SELECT json_build_object(
    'export_info', json_build_object(
      'exported_at', NOW(),
      'exported_by', auth.uid(),
      'version', '1.0'
    ),
    'settings', json_agg(
      json_build_object(
        'key', key,
        'value', value,
        'description', description
      )
    )
  ) INTO v_settings
  FROM public.system_settings
  ORDER BY key;
  
  RETURN v_settings;
END;
$function$;

CREATE OR REPLACE FUNCTION public.import_system_settings(
  p_settings_json JSON
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_user_id UUID;
  v_setting RECORD;
  v_validation_result JSON;
  v_success_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_results JSON[] := '{}';
BEGIN
  -- 检查权限
  IF NOT public.can_manage_system_settings() THEN
    RETURN json_build_object(
      'success', false,
      'error', '权限不足，只有管理员可以导入系统设置'
    );
  END IF;
  
  v_user_id := auth.uid();
  
  -- 验证JSON格式
  IF p_settings_json->'settings' IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', '无效的设置文件格式'
    );
  END IF;
  
  -- 遍历设置项
  FOR v_setting IN
    SELECT 
      key,
      value,
      COALESCE(description, '') as description
    FROM json_to_recordset(p_settings_json->'settings') AS x(key TEXT, value TEXT, description TEXT)
  LOOP
    -- 验证设置值
    SELECT public.validate_system_setting(v_setting.key, v_setting.value) 
    INTO v_validation_result;
    
    IF (v_validation_result->>'valid')::BOOLEAN THEN
      BEGIN
        -- 导入设置
        INSERT INTO public.system_settings (key, value, description, updated_by)
        VALUES (v_setting.key, v_setting.value, v_setting.description, v_user_id)
        ON CONFLICT (key) DO UPDATE SET
          value = EXCLUDED.value,
          description = EXCLUDED.description,
          updated_at = NOW(),
          updated_by = EXCLUDED.updated_by;
        
        v_success_count := v_success_count + 1;
        v_results := v_results || json_build_object(
          'key', v_setting.key,
          'status', 'success',
          'message', '导入成功'
        );
        
      EXCEPTION WHEN OTHERS THEN
        v_error_count := v_error_count + 1;
        v_results := v_results || json_build_object(
          'key', v_setting.key,
          'status', 'error',
          'message', SQLERRM
        );
      END;
    ELSE
      v_error_count := v_error_count + 1;
      v_results := v_results || json_build_object(
        'key', v_setting.key,
        'status', 'validation_error',
        'message', v_validation_result->>'error'
      );
    END IF;
  END LOOP;
  
  -- 记录审计日志
  PERFORM public.log_audit_action(
    v_user_id,
    'system_settings_imported',
    'system_settings',
    gen_random_uuid(),
    NULL,
    jsonb_build_object(
      'success_count', v_success_count,
      'error_count', v_error_count
    )
  );
  
  RETURN json_build_object(
    'success', v_error_count = 0,
    'summary', json_build_object(
      'total_settings', v_success_count + v_error_count,
      'success_count', v_success_count,
      'error_count', v_error_count
    ),
    'results', v_results,
    'imported_by', v_user_id,
    'imported_at', NOW()
  );
END;
$function$;

-- ============================================================================
-- 10. 系统设置测试函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.test_system_settings_functions()
RETURNS TABLE(
  test_name TEXT,
  status TEXT,
  details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- 测试1: 检查系统设置表是否存在
  RETURN QUERY
  SELECT 
    'system_settings_table_exists'::TEXT,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'system_settings'
      ) THEN 'PASS'::TEXT
      ELSE 'FAIL'::TEXT
    END,
    'Checking if system_settings table exists'::TEXT;
  
  -- 测试2: 检查系统设置管理函数是否存在
  RETURN QUERY
  SELECT 
    'system_settings_functions_exist'::TEXT,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' 
          AND routine_name IN (
            'get_system_setting',
            'update_system_setting',
            'can_manage_system_settings'
          )
      ) THEN 'PASS'::TEXT
      ELSE 'FAIL'::TEXT
    END,
    'Checking if system settings management functions exist'::TEXT;
  
  -- 测试3: 检查默认设置是否已初始化
  RETURN QUERY
  SELECT 
    'default_settings_initialized'::TEXT,
    CASE 
      WHEN (SELECT COUNT(*) FROM public.system_settings) > 0
      THEN 'PASS'::TEXT
      ELSE 'WARNING'::TEXT
    END,
    'Checking if default system settings are initialized'::TEXT;
  
  -- 测试4: 测试设置验证函数
  RETURN QUERY
  SELECT 
    'setting_validation_test'::TEXT,
    CASE 
      WHEN (SELECT public.validate_system_setting('password_min_length', '8')->>'valid')::BOOLEAN
      THEN 'PASS'::TEXT
      ELSE 'FAIL'::TEXT
    END,
    'Testing system setting validation function'::TEXT;
END;
$function$;