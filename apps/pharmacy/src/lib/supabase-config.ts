/**
 * Supabase 环境配置管理
 * 提供开发和生产环境的数据库隔离
 */

import { env, isDevelopment, isProduction } from './env';

// 环境特定的 Supabase 配置
export interface SupabaseEnvironmentConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
  environment: 'development' | 'production' | 'staging';
  databaseName?: string;
  schema?: string;
}

/**
 * 获取当前环境的 Supabase 配置
 */
export function getSupabaseConfig(): SupabaseEnvironmentConfig {
  // 基础配置
  const baseConfig: SupabaseEnvironmentConfig = {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
    environment: env.APP_ENV as 'development' | 'production' | 'staging',
  };

  // 开发环境配置
  if (isDevelopment) {
    return {
      ...baseConfig,
      environment: 'development',
      schema: 'public', // 开发环境使用默认 schema
      databaseName: 'development',
    };
  }

  // 生产环境配置
  if (isProduction) {
    return {
      ...baseConfig,
      environment: 'production',
      schema: 'public', // 生产环境使用默认 schema
      databaseName: 'production',
    };
  }

  // 默认配置 (staging 或其他环境)
  return {
    ...baseConfig,
    environment: 'staging',
    schema: 'public',
    databaseName: 'staging',
  };
}

/**
 * 验证 Supabase 配置
 */
export function validateSupabaseConfig(
  config: SupabaseEnvironmentConfig
): void {
  if (!config.url) {
    throw new Error('Supabase URL is required');
  }

  if (!config.url.startsWith('https://')) {
    throw new Error('Supabase URL must use HTTPS');
  }

  if (!config.url.includes('.supabase.co')) {
    throw new Error('Invalid Supabase URL format');
  }

  if (!config.anonKey) {
    throw new Error('Supabase anon key is required');
  }

  if (!config.anonKey.startsWith('eyJ')) {
    throw new Error('Invalid Supabase anon key format');
  }

  // 生产环境额外验证
  if (config.environment === 'production') {
    if (config.url.includes('localhost') || config.url.includes('127.0.0.1')) {
      throw new Error('Production environment cannot use localhost URLs');
    }
  }
}

/**
 * 获取环境特定的表前缀
 */
export function getTablePrefix(): string {
  const config = getSupabaseConfig();

  switch (config.environment) {
    case 'development':
      return 'dev_';
    case 'staging':
      return 'staging_';
    case 'production':
      return ''; // 生产环境不使用前缀
    default:
      return 'test_';
  }
}

/**
 * 获取环境特定的存储桶名称
 */
export function getStorageBucketName(baseName: string): string {
  const config = getSupabaseConfig();

  switch (config.environment) {
    case 'development':
      return `dev-${baseName}`;
    case 'staging':
      return `staging-${baseName}`;
    case 'production':
      return baseName; // 生产环境使用原始名称
    default:
      return `test-${baseName}`;
  }
}

/**
 * 检查是否为安全环境 (生产环境)
 */
export function isSecureEnvironment(): boolean {
  const config = getSupabaseConfig();
  return config.environment === 'production';
}

/**
 * 获取数据库连接选项
 */
export function getDatabaseOptions() {
  const config = getSupabaseConfig();

  return {
    // 认证配置
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: `pharmacy-auth-${config.environment}`,
      flowType: 'pkce' as const,
    },

    // 实时订阅配置
    realtime: {
      params: {
        eventsPerSecond: config.environment === 'production' ? 10 : 50,
      },
    },

    // 全局配置
    global: {
      headers: {
        'X-Environment': config.environment,
        'X-Client-Info': `pharmacy-system/${env.APP_VERSION}`,
      },
    },
  };
}

/**
 * 环境特定的错误处理
 */
export function handleEnvironmentError(error: unknown, context: string): void {
  const config = getSupabaseConfig();

  // 开发环境：详细错误信息
  if (config.environment === 'development') {
    console.error(`[${context}] Supabase Error:`, error);
    console.error('Environment:', config.environment);
    console.error('URL:', config.url);
  }

  // 生产环境：简化错误信息
  if (config.environment === 'production') {
    console.error(`[${context}] Database operation failed`);

    // 可以在这里集成错误监控服务
    if (env.SENTRY_DSN) {
      // Sentry.captureException(error, { tags: { context, environment: config.environment } });
    }
  }
}

/**
 * 获取环境信息摘要
 */
export function getEnvironmentSummary() {
  const config = getSupabaseConfig();

  return {
    environment: config.environment,
    databaseName: config.databaseName,
    tablePrefix: getTablePrefix(),
    isSecure: isSecureEnvironment(),
    url: config.url.replace(/\/\/([^.]+)/, '//***'), // 隐藏项目 ID
  };
}

// 导出配置实例
export const supabaseConfig = getSupabaseConfig();

// 验证配置
validateSupabaseConfig(supabaseConfig);

// 开发环境下输出配置信息
if (isDevelopment) {
  console.log('Supabase Environment Config:', getEnvironmentSummary());
}
