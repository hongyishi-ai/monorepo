-- 安全审计功能
-- 基于实际 Supabase 数据库同步更新

-- ============================================================================
-- 1. 详细安全审计函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.security_audit_detailed()
RETURNS TABLE(
  check_category TEXT,
  check_name TEXT,
  status TEXT,
  details TEXT,
  severity TEXT,
  recommendation TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- 1. 检查SECURITY DEFINER视图
  RETURN QUERY
  SELECT 
    'SECURITY_DEFINER_VIEWS'::TEXT as check_category,
    'medicine_inventory_summary视图检查'::TEXT as check_name,
    CASE WHEN EXISTS(
      SELECT 1 FROM pg_views 
      WHERE schemaname = 'public' 
        AND viewname = 'medicine_inventory_summary'
        AND definition ILIKE '%SECURITY DEFINER%'
    ) THEN '发现问题' ELSE '正常' END::TEXT as status,
    CASE WHEN EXISTS(
      SELECT 1 FROM pg_views 
      WHERE schemaname = 'public' 
        AND viewname = 'medicine_inventory_summary'
        AND definition ILIKE '%SECURITY DEFINER%'
    ) THEN '视图使用了SECURITY DEFINER属性' 
         ELSE '视图未使用SECURITY DEFINER属性' END::TEXT as details,
    CASE WHEN EXISTS(
      SELECT 1 FROM pg_views 
      WHERE schemaname = 'public' 
        AND viewname = 'medicine_inventory_summary'
        AND definition ILIKE '%SECURITY DEFINER%'
    ) THEN 'ERROR' ELSE 'INFO' END::TEXT as severity,
    '如果使用了SECURITY DEFINER，应重新创建为普通视图'::TEXT as recommendation;

  -- 2. 检查RLS状态
  RETURN QUERY
  SELECT 
    'RLS_STATUS'::TEXT,
    'expired_medicine_actions表RLS检查'::TEXT,
    CASE WHEN EXISTS(
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename = 'expired_medicine_actions'
        AND rowsecurity = true
    ) THEN '正常' ELSE '发现问题' END::TEXT,
    CASE WHEN EXISTS(
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename = 'expired_medicine_actions'
        AND rowsecurity = true
    ) THEN 'RLS已启用' 
         ELSE 'RLS未启用' END::TEXT,
    CASE WHEN EXISTS(
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename = 'expired_medicine_actions'
        AND rowsecurity = true
    ) THEN 'INFO' ELSE 'ERROR' END::TEXT,
    CASE WHEN EXISTS(
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename = 'expired_medicine_actions'
        AND rowsecurity = true
    ) THEN '继续保持RLS启用状态' 
         ELSE '需要启用RLS并创建适当的策略' END::TEXT;

  -- 3. 检查函数搜索路径安全性
  RETURN QUERY
  SELECT 
    'FUNCTION_SEARCH_PATH'::TEXT,
    '函数搜索路径安全性检查'::TEXT,
    CASE 
      WHEN (SELECT COUNT(*) FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public'
              AND p.proconfig IS NOT NULL 
              AND array_to_string(p.proconfig, ',') ILIKE '%search_path%') > 30
      THEN '正常' ELSE '需要改进' END::TEXT,
    '已加固函数数量: ' || (SELECT COUNT(*) FROM pg_proc p
                                    JOIN pg_namespace n ON p.pronamespace = n.oid
                                    WHERE n.nspname = 'public'
                                      AND p.proconfig IS NOT NULL 
                                      AND array_to_string(p.proconfig, ',') ILIKE '%search_path%')::TEXT,
    'INFO'::TEXT,
    '继续为所有函数添加search_path安全设置'::TEXT;
END;
$function$;

-- ============================================================================
-- 2. 安全监控视图函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.security_monitor_views()
RETURNS TABLE(
  check_category TEXT,
  object_name TEXT,
  object_type TEXT,
  security_level TEXT,
  issue_description TEXT,
  fix_recommendation TEXT,
  priority TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- 检查所有视图的SECURITY DEFINER
  RETURN QUERY
  SELECT 
    'VIEW_SECURITY'::TEXT,
    v.viewname::TEXT,
    'VIEW'::TEXT,
    CASE 
      WHEN v.definition ILIKE '%SECURITY%DEFINER%' THEN 'CRITICAL'
      WHEN v.definition ILIKE '%DEFINER%' THEN 'WARNING'
      ELSE 'SAFE'
    END::TEXT,
    CASE 
      WHEN v.definition ILIKE '%SECURITY%DEFINER%' THEN 'View has SECURITY DEFINER - bypasses RLS'
      WHEN v.definition ILIKE '%DEFINER%' THEN 'View contains DEFINER keyword - needs review'
      ELSE 'View is secure - respects RLS policies'
    END::TEXT,
    CASE 
      WHEN v.definition ILIKE '%SECURITY%DEFINER%' THEN 'DROP and recreate view without SECURITY DEFINER'
      WHEN v.definition ILIKE '%DEFINER%' THEN 'Review view definition manually'
      ELSE 'No action required'
    END::TEXT,
    CASE 
      WHEN v.definition ILIKE '%SECURITY%DEFINER%' THEN 'HIGH'
      WHEN v.definition ILIKE '%DEFINER%' THEN 'MEDIUM'
      ELSE 'LOW'
    END::TEXT
  FROM pg_views v
  WHERE v.schemaname = 'public';

  -- 检查所有函数的不必要SECURITY DEFINER
  RETURN QUERY
  SELECT 
    'FUNCTION_SECURITY'::TEXT,
    r.routine_name::TEXT,
    'FUNCTION'::TEXT,
    CASE 
      WHEN r.security_type = 'DEFINER' AND r.routine_name NOT LIKE '%auth%' 
           AND r.routine_name NOT LIKE '%admin%' 
           AND r.routine_name NOT LIKE '%security%'
           AND r.routine_name NOT LIKE '%audit%' THEN 'REVIEW'
      WHEN r.security_type = 'DEFINER' THEN 'EXPECTED'
      ELSE 'SAFE'
    END::TEXT,
    CASE 
      WHEN r.security_type = 'DEFINER' THEN 'Function uses SECURITY DEFINER'
      ELSE 'Function uses SECURITY INVOKER (default)'
    END::TEXT,
    CASE 
      WHEN r.security_type = 'DEFINER' AND r.routine_name NOT LIKE '%auth%' 
           AND r.routine_name NOT LIKE '%admin%' 
           AND r.routine_name NOT LIKE '%security%'
           AND r.routine_name NOT LIKE '%audit%' THEN 'Review if SECURITY DEFINER is necessary'
      ELSE 'Current setting is appropriate'
    END::TEXT,
    'MEDIUM'::TEXT
  FROM information_schema.routines r
  WHERE r.routine_schema = 'public';
END;
$function$;

-- ============================================================================
-- 3. 视图安全测试函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.test_view_security()
RETURNS TABLE(
  test_name TEXT,
  view_name TEXT,
  security_status TEXT,
  details TEXT,
  recommendation TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- 测试 1: 检查视图是否有SECURITY DEFINER属性
  RETURN QUERY
  SELECT 
    'SECURITY_DEFINER_CHECK'::TEXT,
    v.viewname::TEXT,
    CASE 
      WHEN v.definition ILIKE '%SECURITY%DEFINER%' THEN 'CRITICAL: Has SECURITY DEFINER'
      WHEN v.definition ILIKE '%DEFINER%' THEN 'WARNING: Contains DEFINER keyword'
      ELSE 'SAFE: Normal view'
    END::TEXT,
    CASE 
      WHEN v.definition ILIKE '%SECURITY%DEFINER%' THEN 'View bypasses RLS policies'
      WHEN v.definition ILIKE '%DEFINER%' THEN 'Manual review needed'
      ELSE 'View respects RLS policies'
    END::TEXT,
    CASE 
      WHEN v.definition ILIKE '%SECURITY%DEFINER%' THEN 'Recreate view without SECURITY DEFINER'
      WHEN v.definition ILIKE '%DEFINER%' THEN 'Review definition for security issues'
      ELSE 'No action needed'
    END::TEXT
  FROM pg_views v
  WHERE v.schemaname = 'public' 
    AND v.viewname IN ('medicine_inventory_summary', 'expiring_medicines', 'low_stock_medicines');

  -- 测试 2: 检查底层表RLS状态
  RETURN QUERY
  SELECT 
    'UNDERLYING_TABLE_RLS'::TEXT,
    t.tablename::TEXT,
    CASE 
      WHEN t.rowsecurity THEN 'SECURE: RLS Enabled'
      ELSE 'CRITICAL: RLS Disabled'
    END::TEXT,
    CASE 
      WHEN t.rowsecurity THEN 'Table has row-level security'
      ELSE 'Table allows unrestricted access'
    END::TEXT,
    CASE 
      WHEN t.rowsecurity THEN 'Continue monitoring'
      ELSE 'Enable RLS immediately'
    END::TEXT
  FROM pg_tables t
  WHERE t.schemaname = 'public' 
    AND t.tablename IN ('medicines', 'batches', 'system_settings');

  -- 测试 3: 检查视图所有权
  RETURN QUERY
  SELECT 
    'VIEW_OWNERSHIP'::TEXT,
    c.relname::TEXT,
    CASE 
      WHEN u.usename = 'postgres' THEN 'STANDARD: postgres owned'
      ELSE 'REVIEW: ' || u.usename || ' owned'
    END::TEXT,
    'View owner: ' || u.usename::TEXT,
    CASE 
      WHEN u.usename = 'postgres' THEN 'Standard configuration'
      ELSE 'Review ownership implications'
    END::TEXT
  FROM pg_class c
  JOIN pg_user u ON c.relowner = u.usesysid
  WHERE c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND c.relname IN ('medicine_inventory_summary', 'expiring_medicines', 'low_stock_medicines')
    AND c.relkind = 'v';
END;
$function$;

-- ============================================================================
-- 4. 视图RLS合规性测试
-- ============================================================================

CREATE OR REPLACE FUNCTION public.test_view_rls_compliance()
RETURNS TABLE(
  test_name TEXT,
  view_name TEXT,
  test_result TEXT,
  details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- 测试 1: 验证视图存在且可访问
  RETURN QUERY
  SELECT 
    'VIEW_ACCESSIBILITY'::TEXT,
    v.viewname::TEXT,
    'ACCESSIBLE'::TEXT,
    'View exists and can be queried'::TEXT
  FROM pg_views v
  WHERE v.schemaname = 'public' 
    AND v.viewname IN ('medicine_inventory_summary', 'expiring_medicines', 'low_stock_medicines');

  -- 测试 2: 检查视图是否返回数据（基本功能测试）
  BEGIN
    IF (SELECT COUNT(*) FROM public.medicine_inventory_summary) >= 0 THEN
      RETURN QUERY SELECT 
        'FUNCTIONALITY_TEST'::TEXT,
        'medicine_inventory_summary'::TEXT,
        'WORKING'::TEXT,
        'View returns data successfully'::TEXT;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
      'FUNCTIONALITY_TEST'::TEXT,
      'medicine_inventory_summary'::TEXT,
      'ERROR'::TEXT,
      'View query failed: ' || SQLERRM::TEXT;
  END;

  BEGIN
    IF (SELECT COUNT(*) FROM public.expiring_medicines) >= 0 THEN
      RETURN QUERY SELECT 
        'FUNCTIONALITY_TEST'::TEXT,
        'expiring_medicines'::TEXT,
        'WORKING'::TEXT,
        'View returns data successfully'::TEXT;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
      'FUNCTIONALITY_TEST'::TEXT,
      'expiring_medicines'::TEXT,
      'ERROR'::TEXT,
      'View query failed: ' || SQLERRM::TEXT;
  END;

  BEGIN
    IF (SELECT COUNT(*) FROM public.low_stock_medicines) >= 0 THEN
      RETURN QUERY SELECT 
        'FUNCTIONALITY_TEST'::TEXT,
        'low_stock_medicines'::TEXT,
        'WORKING'::TEXT,
        'View returns data successfully'::TEXT;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
      'FUNCTIONALITY_TEST'::TEXT,
      'low_stock_medicines'::TEXT,
      'ERROR'::TEXT,
      'View query failed: ' || SQLERRM::TEXT;
  END;

  -- 测试 3: 验证底层表有RLS
  RETURN QUERY
  SELECT 
    'RLS_VERIFICATION'::TEXT,
    t.tablename::TEXT,
    CASE WHEN t.rowsecurity THEN 'RLS_ENABLED' ELSE 'RLS_DISABLED' END::TEXT,
    CASE WHEN t.rowsecurity THEN 'Table properly protected by RLS' 
         ELSE 'WARNING: Table lacks RLS protection' END::TEXT
  FROM pg_tables t
  WHERE t.schemaname = 'public' 
    AND t.tablename IN ('medicines', 'batches', 'system_settings');
END;
$function$;

-- ============================================================================
-- 5. 关键视图检查函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_critical_views()
RETURNS TABLE(
  view_name TEXT,
  is_secure BOOLEAN,
  security_status TEXT,
  recommendation TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    v.viewname::TEXT,
    NOT (v.definition ILIKE '%SECURITY%DEFINER%') as is_secure,
    CASE 
      WHEN v.definition ILIKE '%SECURITY%DEFINER%' THEN '❌ SECURITY DEFINER DETECTED'
      ELSE '✅ SECURE - Normal view'
    END::TEXT,
    CASE 
      WHEN v.definition ILIKE '%SECURITY%DEFINER%' THEN 'URGENT: Recreate view without SECURITY DEFINER'
      ELSE 'No action needed - view is secure'
    END::TEXT
  FROM pg_views v
  WHERE v.schemaname = 'public' 
    AND v.viewname IN ('medicine_inventory_summary', 'expiring_medicines', 'low_stock_medicines')
  ORDER BY v.viewname;
END;
$function$;

-- ============================================================================
-- 6. 安全最佳实践指南函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.security_best_practices_guide()
RETURNS TABLE(
  category TEXT,
  practice TEXT,
  frequency TEXT,
  sql_command TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN QUERY VALUES
    ('MONITORING', 'Check critical views security', 'Weekly', 'SELECT * FROM public.check_critical_views();'),
    ('MONITORING', 'Run comprehensive security scan', 'Monthly', 'SELECT * FROM public.security_monitor_views();'),
    ('MONITORING', 'Test RLS compliance', 'Monthly', 'SELECT * FROM public.test_view_rls_compliance();'),
    ('PREVENTION', 'Never use SECURITY DEFINER on views', 'Always', 'CREATE VIEW name AS SELECT ... (without SECURITY DEFINER)'),
    ('PREVENTION', 'Always enable RLS on new tables', 'Always', 'ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;'),
    ('PREVENTION', 'Review function SECURITY DEFINER usage', 'Quarterly', 'SELECT routine_name FROM information_schema.routines WHERE security_type = ''DEFINER'';'),
    ('PREVENTION', 'Add search_path to all functions', 'Always', 'CREATE FUNCTION name() ... SET search_path = public, pg_catalog;'),
    ('AUDIT', 'Review user permissions', 'Monthly', 'SELECT * FROM pg_policies WHERE schemaname = ''public'';'),
    ('AUDIT', 'Check for orphaned policies', 'Quarterly', 'SELECT * FROM pg_policies WHERE tablename NOT IN (SELECT tablename FROM pg_tables);'),
    ('BACKUP', 'Verify RLS policies in backups', 'Before major changes', 'pg_dump --schema-only | grep POLICY'),
    ('SECURITY', 'Monitor function search path vulnerabilities', 'Weekly', 'SELECT routine_name FROM information_schema.routines WHERE routine_definition NOT ILIKE ''%search_path%'';'),
    ('SECURITY', 'Audit authentication settings', 'Monthly', 'Review Supabase Auth configuration for MFA and password policies');
END;
$function$;

-- ============================================================================
-- 7. 认证安全建议函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_authentication_security_recommendations()
RETURNS TABLE(
  category TEXT,
  issue TEXT,
  severity TEXT,
  recommendation TEXT,
  implementation_steps TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN QUERY VALUES
    ('PASSWORD_SECURITY', 'Leaked Password Protection Disabled', 'HIGH', 'Enable HaveIBeenPwned integration in Supabase Auth', 'Go to Supabase Dashboard > Authentication > Settings > Enable "Check for compromised passwords"'),
    ('PASSWORD_SECURITY', 'Weak Password Policy', 'MEDIUM', 'Strengthen password requirements', 'Set minimum 12 characters, require uppercase, lowercase, numbers, and special characters'),
    ('MFA_SECURITY', 'Insufficient MFA Options', 'HIGH', 'Enable multiple MFA methods', 'Enable TOTP, SMS, and Email MFA options in Supabase Auth settings'),
    ('MFA_SECURITY', 'MFA Not Enforced', 'CRITICAL', 'Enforce MFA for admin users', 'Create policy to require MFA for users with admin or manager roles'),
    ('SESSION_SECURITY', 'Long Session Timeout', 'MEDIUM', 'Reduce session timeout for sensitive operations', 'Set session timeout to 8 hours for regular users, 4 hours for admins'),
    ('AUDIT_SECURITY', 'Login Attempt Monitoring', 'MEDIUM', 'Monitor failed login attempts', 'Implement rate limiting and alerting for suspicious login patterns'),
    ('ACCESS_CONTROL', 'Role-Based Access Control', 'HIGH', 'Implement granular RBAC', 'Define specific permissions for each role (Admin, Pharmacist, Staff)'),
    ('COMPLIANCE', 'Regulatory Compliance', 'CRITICAL', 'Ensure HIPAA/pharmacy compliance', 'Implement audit logging, data encryption, and access controls per regulations');
END;
$function$;

-- ============================================================================
-- 8. 用户数据一致性检查函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_user_data_consistency()
RETURNS TABLE(
  issue_type TEXT,
  auth_user_id UUID,
  public_user_id UUID,
  auth_email TEXT,
  public_email TEXT,
  description TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- 检查在 auth.users 中存在但在 public.users 中缺失的用户
  RETURN QUERY
  SELECT 
    'missing_in_public'::TEXT,
    au.id,
    NULL::UUID,
    au.email,
    NULL::TEXT,
    '在 auth.users 中存在但在 public.users 中缺失'::TEXT
  FROM auth.users au
  LEFT JOIN public.users pu ON au.id = pu.id
  WHERE pu.id IS NULL;
  
  -- 检查在 public.users 中存在但在 auth.users 中缺失的用户
  RETURN QUERY
  SELECT 
    'missing_in_auth'::TEXT,
    NULL::UUID,
    pu.id,
    NULL::TEXT,
    pu.email,
    '在 public.users 中存在但在 auth.users 中缺失'::TEXT
  FROM public.users pu
  LEFT JOIN auth.users au ON pu.id = au.id
  WHERE au.id IS NULL;
  
  -- 检查邮箱地址不一致的用户
  RETURN QUERY
  SELECT 
    'email_mismatch'::TEXT,
    au.id,
    pu.id,
    au.email,
    pu.email,
    '邮箱地址不一致'::TEXT
  FROM auth.users au
  JOIN public.users pu ON au.id = pu.id
  WHERE au.email != pu.email;
END;
$function$;

-- ============================================================================
-- 9. 安全审计报告生成函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_security_audit_report()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_report JSON;
  v_critical_issues INTEGER;
  v_warning_issues INTEGER;
  v_info_issues INTEGER;
BEGIN
  -- 统计各级别问题数量
  SELECT 
    COUNT(*) FILTER (WHERE severity = 'ERROR') as critical,
    COUNT(*) FILTER (WHERE severity = 'WARNING') as warning,
    COUNT(*) FILTER (WHERE severity = 'INFO') as info
  INTO v_critical_issues, v_warning_issues, v_info_issues
  FROM public.security_audit_detailed();
  
  -- 生成完整报告
  SELECT json_build_object(
    'report_timestamp', NOW(),
    'summary', json_build_object(
      'critical_issues', v_critical_issues,
      'warning_issues', v_warning_issues,
      'info_issues', v_info_issues,
      'total_checks', v_critical_issues + v_warning_issues + v_info_issues
    ),
    'detailed_findings', (
      SELECT json_agg(
        json_build_object(
          'category', check_category,
          'check_name', check_name,
          'status', status,
          'details', details,
          'severity', severity,
          'recommendation', recommendation
        )
      )
      FROM public.security_audit_detailed()
    ),
    'view_security_status', (
      SELECT json_agg(
        json_build_object(
          'view_name', view_name,
          'is_secure', is_secure,
          'status', security_status,
          'recommendation', recommendation
        )
      )
      FROM public.check_critical_views()
    ),
    'user_consistency_issues', (
      SELECT json_agg(
        json_build_object(
          'issue_type', issue_type,
          'description', description,
          'auth_user_id', auth_user_id,
          'public_user_id', public_user_id
        )
      )
      FROM public.check_user_data_consistency()
    )
  ) INTO v_report;
  
  RETURN v_report;
END;
$function$;

-- ============================================================================
-- 10. 安全审计定时任务函数
-- ============================================================================

CREATE OR REPLACE FUNCTION public.schedule_security_audit()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_audit_result JSON;
  v_critical_count INTEGER;
BEGIN
  -- 执行安全审计
  v_audit_result := public.generate_security_audit_report();
  
  -- 获取关键问题数量
  v_critical_count := (v_audit_result->'summary'->>'critical_issues')::INTEGER;
  
  -- 如果有关键问题，记录到审计日志
  IF v_critical_count > 0 THEN
    PERFORM public.log_audit_action(
      auth.uid(),
      'security_audit_critical',
      'system',
      gen_random_uuid(),
      NULL,
      jsonb_build_object(
        'critical_issues_count', v_critical_count,
        'audit_timestamp', NOW(),
        'requires_immediate_attention', true
      )
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'audit_completed_at', NOW(),
    'critical_issues_found', v_critical_count,
    'full_report', v_audit_result
  );
END;
$function$;