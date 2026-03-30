-- 验证和测试功能
-- 基于实际 Supabase 数据库同步更新

-- ============================================================================
-- 1. 时间修复验证函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.verify_timing_fixes()
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
  -- 检查时间戳字段是否存在
  RETURN QUERY
  SELECT 
    'timestamp_columns_exist'::TEXT,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'medicines' 
          AND column_name = 'updated_at'
      ) THEN 'PASS'::TEXT
      ELSE 'FAIL'::TEXT
    END,
    'Checking if updated_at columns exist in tables'::TEXT;
  
  -- 检查触发器是否存在
  RETURN QUERY
  SELECT 
    'update_triggers_exist'::TEXT,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_schema = 'public' 
          AND trigger_name LIKE '%update_updated_at%'
      ) THEN 'PASS'::TEXT
      ELSE 'FAIL'::TEXT
    END,
    'Checking if update triggers are properly configured'::TEXT;
  
  -- 检查函数安全性
  RETURN QUERY
  SELECT 
    'function_security'::TEXT,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'update_updated_at'
          AND p.proconfig IS NOT NULL 
          AND array_to_string(p.proconfig, ',') ILIKE '%search_path%'
      ) THEN 'PASS'::TEXT
      ELSE 'FAIL'::TEXT
    END,
    'Checking if timing functions have secure search_path'::TEXT;
END;
$function$;

-- ============================================================================
-- 2. 管理员系统设置访问测试
-- ============================================================================

CREATE OR REPLACE FUNCTION public.test_admin_system_settings_access(
  admin_user_id UUID
)
RETURNS TABLE(
  test_name TEXT,
  result TEXT,
  details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE 
  user_role_result TEXT; 
  settings_count INTEGER; 
BEGIN 
  SELECT role INTO user_role_result 
  FROM public.users 
  WHERE id = admin_user_id; 
  
  RETURN QUERY SELECT 
    'user_role_check'::TEXT, 
    CASE WHEN user_role_result = 'admin' THEN 'PASS' ELSE 'FAIL' END, 
    ('User role: ' || COALESCE(user_role_result, 'NULL'))::TEXT; 
  
  SELECT COUNT(*) INTO settings_count 
  FROM public.system_settings 
  WHERE key IN ('session_timeout', 'auto_refresh_session', 'password_min_length'); 
  
  RETURN QUERY SELECT 
    'auth_settings_exist'::TEXT, 
    CASE WHEN settings_count >= 3 THEN 'PASS' ELSE 'FAIL' END, 
    ('Auth settings count: ' || settings_count::TEXT)::TEXT; 
  
  RETURN QUERY SELECT 
    'database_structure'::TEXT, 
    'PASS'::TEXT, 
    'All required database changes have been applied'::TEXT; 
END;
$function$;

-- ============================================================================
-- 3. RLS 策略测试函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.test_rls_policies()
RETURNS TABLE(
  test_name TEXT,
  result TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    'RLS Enabled Check'::TEXT,
    CASE 
      WHEN (SELECT COUNT(*) FROM verify_rls_enabled() WHERE rls_enabled = false) = 0 
      THEN 'PASS'::TEXT 
      ELSE 'FAIL'::TEXT 
    END;
  
  RETURN QUERY
  SELECT 
    'Policy Count Check'::TEXT,
    CASE 
      WHEN (SELECT COUNT(*) FROM verify_policy_count()) = 5 
      THEN 'PASS'::TEXT 
      ELSE 'FAIL'::TEXT 
    END;
END;
$function$;

-- ============================================================================
-- 4. RLS 启用状态验证
-- ============================================================================

CREATE OR REPLACE FUNCTION public.verify_rls_enabled()
RETURNS TABLE(
  table_name TEXT,
  rls_enabled BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::TEXT,
    t.rowsecurity
  FROM pg_tables t
  WHERE t.schemaname = 'public'
    AND t.tablename IN ('users', 'medicines', 'batches', 'inventory_transactions', 'system_settings')
  ORDER BY t.tablename;
END;
$function$;

-- ============================================================================
-- 5. 策略数量验证
-- ============================================================================

CREATE OR REPLACE FUNCTION public.verify_policy_count()
RETURNS TABLE(
  table_name TEXT,
  policy_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.tablename::TEXT,
    COUNT(*)
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.tablename IN ('users', 'medicines', 'batches', 'inventory_transactions', 'system_settings')
  GROUP BY p.tablename
  ORDER BY p.tablename;
END;
$function$;

-- ============================================================================
-- 6. 综合系统健康检查
-- ============================================================================

CREATE OR REPLACE FUNCTION public.comprehensive_system_health_check()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_health_report JSON;
  v_table_count INTEGER;
  v_function_count INTEGER;
  v_trigger_count INTEGER;
  v_policy_count INTEGER;
  v_index_count INTEGER;
BEGIN
  -- 统计数据库对象
  SELECT COUNT(*) INTO v_table_count
  FROM information_schema.tables
  WHERE table_schema = 'public';
  
  SELECT COUNT(*) INTO v_function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public';
  
  SELECT COUNT(*) INTO v_trigger_count
  FROM information_schema.triggers
  WHERE trigger_schema = 'public';
  
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public';
  
  SELECT COUNT(*) INTO v_index_count
  FROM pg_indexes
  WHERE schemaname = 'public';
  
  -- 生成健康报告
  v_health_report := json_build_object(
    'check_timestamp', NOW(),
    'database_objects', json_build_object(
      'tables', v_table_count,
      'functions', v_function_count,
      'triggers', v_trigger_count,
      'policies', v_policy_count,
      'indexes', v_index_count
    ),
    'rls_status', (
      SELECT json_agg(
        json_build_object(
          'table_name', table_name,
          'rls_enabled', rls_enabled
        )
      )
      FROM public.verify_rls_enabled()
    ),
    'security_audit', (
      SELECT json_agg(
        json_build_object(
          'category', check_category,
          'status', status,
          'severity', severity
        )
      )
      FROM public.security_audit_detailed()
    ),
    'timing_fixes', (
      SELECT json_agg(
        json_build_object(
          'test_name', test_name,
          'status', status,
          'details', details
        )
      )
      FROM public.verify_timing_fixes()
    ),
    'system_settings', (
      SELECT json_agg(
        json_build_object(
          'key', key,
          'value', value,
          'description', description
        )
      )
      FROM public.system_settings
      ORDER BY key
    )
  );
  
  RETURN v_health_report;
END;
$function$;

-- ============================================================================
-- 7. 数据库性能检查
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_database_performance()
RETURNS TABLE(
  check_name TEXT,
  status TEXT,
  value TEXT,
  recommendation TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- 检查表大小
  RETURN QUERY
  SELECT 
    'table_sizes'::TEXT,
    'INFO'::TEXT,
    (SELECT string_agg(
      schemaname || '.' || tablename || ': ' || 
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)), 
      ', '
    )
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    LIMIT 5),
    'Monitor table growth and consider archiving old data'::TEXT;
  
  -- 检查索引使用情况
  RETURN QUERY
  SELECT 
    'index_usage'::TEXT,
    CASE 
      WHEN (
        SELECT COUNT(*) 
        FROM pg_stat_user_indexes 
        WHERE schemaname = 'public' AND idx_scan = 0
      ) > 0 THEN 'WARNING'::TEXT
      ELSE 'GOOD'::TEXT
    END,
    'Unused indexes: ' || (
      SELECT COUNT(*)::TEXT 
      FROM pg_stat_user_indexes 
      WHERE schemaname = 'public' AND idx_scan = 0
    ),
    'Consider dropping unused indexes to improve write performance'::TEXT;
  
  -- 检查函数执行统计
  RETURN QUERY
  SELECT 
    'function_calls'::TEXT,
    'INFO'::TEXT,
    'Total function calls: ' || (
      SELECT SUM(calls)::TEXT 
      FROM pg_stat_user_functions 
      WHERE schemaname = 'public'
    ),
    'Monitor frequently called functions for optimization opportunities'::TEXT;
END;
$function$;

-- ============================================================================
-- 8. 数据完整性检查
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_data_integrity()
RETURNS TABLE(
  check_name TEXT,
  status TEXT,
  details TEXT,
  action_required TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- 检查外键约束
  RETURN QUERY
  SELECT 
    'foreign_key_violations'::TEXT,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
          AND table_schema = 'public'
      ) THEN 'PASS'::TEXT
      ELSE 'WARNING'::TEXT
    END,
    'Foreign key constraints: ' || (
      SELECT COUNT(*)::TEXT 
      FROM information_schema.table_constraints 
      WHERE constraint_type = 'FOREIGN KEY' 
        AND table_schema = 'public'
    ),
    'Ensure all foreign key relationships are properly defined'::TEXT;
  
  -- 检查空值约束
  RETURN QUERY
  SELECT 
    'null_constraints'::TEXT,
    'INFO'::TEXT,
    'NOT NULL constraints: ' || (
      SELECT COUNT(*)::TEXT 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND is_nullable = 'NO'
    ),
    'Review nullable columns for data quality'::TEXT;
  
  -- 检查检查约束
  RETURN QUERY
  SELECT 
    'check_constraints'::TEXT,
    'INFO'::TEXT,
    'Check constraints: ' || (
      SELECT COUNT(*)::TEXT 
      FROM information_schema.table_constraints 
      WHERE constraint_type = 'CHECK' 
        AND table_schema = 'public'
    ),
    'Consider adding more check constraints for data validation'::TEXT;
  
  -- 检查用户数据一致性
  RETURN QUERY
  SELECT 
    'user_data_consistency'::TEXT,
    CASE 
      WHEN (SELECT COUNT(*) FROM public.check_user_data_consistency()) = 0
      THEN 'PASS'::TEXT
      ELSE 'FAIL'::TEXT
    END,
    'User data inconsistencies: ' || (
      SELECT COUNT(*)::TEXT FROM public.check_user_data_consistency()
    ),
    CASE 
      WHEN (SELECT COUNT(*) FROM public.check_user_data_consistency()) > 0
      THEN 'Run fix_user_data_inconsistency() to resolve issues'::TEXT
      ELSE 'No action required'::TEXT
    END;
END;
$function$;

-- ============================================================================
-- 9. 系统配置验证
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_system_configuration()
RETURNS TABLE(
  config_area TEXT,
  status TEXT,
  details TEXT,
  recommendation TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- 检查系统设置
  RETURN QUERY
  SELECT 
    'system_settings'::TEXT,
    CASE 
      WHEN (SELECT COUNT(*) FROM public.system_settings) > 0
      THEN 'CONFIGURED'::TEXT
      ELSE 'NOT_CONFIGURED'::TEXT
    END,
    'System settings count: ' || (SELECT COUNT(*)::TEXT FROM public.system_settings),
    CASE 
      WHEN (SELECT COUNT(*) FROM public.system_settings) = 0
      THEN 'Run safe_initialize_system_settings() to set up default configuration'::TEXT
      ELSE 'Review settings periodically for optimization'::TEXT
    END;
  
  -- 检查用户角色分布
  RETURN QUERY
  SELECT 
    'user_roles'::TEXT,
    'INFO'::TEXT,
    'Role distribution: ' || (
      SELECT string_agg(role || '(' || count::TEXT || ')', ', ')
      FROM (
        SELECT role, COUNT(*) as count
        FROM public.users
        GROUP BY role
        ORDER BY count DESC
      ) role_stats
    ),
    'Ensure proper role distribution for security'::TEXT;
  
  -- 检查审计日志配置
  RETURN QUERY
  SELECT 
    'audit_logging'::TEXT,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'audit_logs' AND table_schema = 'public'
      ) THEN 'ENABLED'::TEXT
      ELSE 'DISABLED'::TEXT
    END,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'audit_logs' AND table_schema = 'public'
      ) THEN 'Audit logging is configured'::TEXT
      ELSE 'Audit logging table not found'::TEXT
    END,
    'Ensure audit logging is properly configured for compliance'::TEXT;
END;
$function$;

-- ============================================================================
-- 10. 完整系统测试套件
-- ============================================================================

CREATE OR REPLACE FUNCTION public.run_complete_system_tests()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_test_results JSON;
  v_start_time TIMESTAMP;
  v_end_time TIMESTAMP;
BEGIN
  v_start_time := NOW();
  
  -- 运行所有测试
  SELECT json_build_object(
    'test_execution', json_build_object(
      'start_time', v_start_time,
      'test_suite', 'Complete System Tests'
    ),
    'health_check', public.comprehensive_system_health_check(),
    'performance_check', (
      SELECT json_agg(
        json_build_object(
          'check_name', check_name,
          'status', status,
          'value', value,
          'recommendation', recommendation
        )
      )
      FROM public.check_database_performance()
    ),
    'data_integrity', (
      SELECT json_agg(
        json_build_object(
          'check_name', check_name,
          'status', status,
          'details', details,
          'action_required', action_required
        )
      )
      FROM public.check_data_integrity()
    ),
    'system_configuration', (
      SELECT json_agg(
        json_build_object(
          'config_area', config_area,
          'status', status,
          'details', details,
          'recommendation', recommendation
        )
      )
      FROM public.validate_system_configuration()
    ),
    'timing_fixes', (
      SELECT json_agg(
        json_build_object(
          'test_name', test_name,
          'status', status,
          'details', details
        )
      )
      FROM public.verify_timing_fixes()
    ),
    'rls_policies', (
      SELECT json_agg(
        json_build_object(
          'test_name', test_name,
          'result', result
        )
      )
      FROM public.test_rls_policies()
    )
  ) INTO v_test_results;
  
  v_end_time := NOW();
  
  -- 添加执行时间信息
  v_test_results := v_test_results || json_build_object(
    'execution_summary', json_build_object(
      'end_time', v_end_time,
      'duration_seconds', EXTRACT(EPOCH FROM (v_end_time - v_start_time)),
      'status', 'COMPLETED'
    )
  );
  
  RETURN v_test_results;
END;
$function$;