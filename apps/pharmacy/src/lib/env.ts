/**
 * 环境变量管理和验证
 * 统一管理应用的环境配置
 */

// 环境变量类型定义
interface EnvironmentConfig {
  // 基础配置
  NODE_ENV: 'development' | 'production' | 'test';
  APP_NAME: string;
  APP_VERSION: string;
  APP_ENV: string;

  // Supabase 配置
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;

  // API 配置
  API_BASE_URL?: string;
  API_TIMEOUT: number;
  API_RETRY_COUNT: number;

  // 功能开关
  ENABLE_DEVTOOLS: boolean;
  ENABLE_ANALYTICS: boolean;
  ENABLE_ERROR_REPORTING: boolean;
  ENABLE_PERFORMANCE_MONITORING: boolean;

  // 开发和调试配置
  DEV_MODE: boolean;
  ENABLE_MOCK: boolean;
  ENABLE_DEBUG: boolean;

  // 构建配置
  BUILD_TARGET: string;
  BUNDLE_ANALYZER: boolean;
  ENABLE_ANALYZE: boolean;

  // 缓存配置
  CACHE_DURATION: number;

  // 安全配置
  ENABLE_CSP: boolean;
  ENABLE_HTTPS_ONLY: boolean;

  // 监控配置
  SENTRY_DSN?: string;
  ANALYTICS_ID?: string;

  // 业务配置
  EXPIRY_WARNING_DAYS: number;
  LOW_STOCK_THRESHOLD: number;
  SCANNER_TIMEOUT: number;
  SCANNER_RETRY_COUNT: number;
}

// 必需的环境变量
const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_APP_ENV',
] as const;

// CI环境中可选的变量（有默认值）
const CI_OPTIONAL_VARS = ['VITE_APP_NAME', 'VITE_APP_VERSION'] as const;

// 检查是否在CI环境中运行
const isCI = (): boolean => {
  return !!(
    import.meta.env.VITE_CI ||
    import.meta.env.VITE_VERCEL ||
    import.meta.env.VITE_GITHUB_ACTIONS
  );
};

// 环境变量验证
const validateEnvironment = (): void => {
  const missingVars = REQUIRED_ENV_VARS.filter(
    varName => !import.meta.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }

  // 在非CI环境中，检查可选变量
  if (!isCI()) {
    const missingOptionalVars = CI_OPTIONAL_VARS.filter(
      varName => !import.meta.env[varName]
    );

    if (missingOptionalVars.length > 0) {
      console.warn(
        `Missing optional environment variables (using defaults): ${missingOptionalVars.join(', ')}`
      );
    }
  }

  // 验证 Supabase URL 格式
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    throw new Error('VITE_SUPABASE_URL must start with https://');
  }

  // 验证 Supabase 密钥格式
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (supabaseKey && !supabaseKey.startsWith('eyJ')) {
    console.warn('VITE_SUPABASE_ANON_KEY format may be incorrect');
  }
};

// 类型安全的环境变量获取
const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
};

const getEnvBoolean = (key: string, defaultValue: boolean = false): boolean => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
};

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
};

// 环境配置对象
export const env: EnvironmentConfig = {
  // 基础配置
  NODE_ENV:
    (import.meta.env.NODE_ENV as 'development' | 'production' | 'test') ||
    'development',
  APP_NAME: getEnvVar('VITE_APP_NAME', '药品出入库管理系统'),
  APP_VERSION: getEnvVar('VITE_APP_VERSION', '1.0.0'),
  APP_ENV: getEnvVar('VITE_APP_ENV', 'development'),

  // Supabase 配置
  SUPABASE_URL: getEnvVar('VITE_SUPABASE_URL'),
  SUPABASE_ANON_KEY: getEnvVar('VITE_SUPABASE_ANON_KEY'),

  // API 配置
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  API_TIMEOUT: getEnvNumber('VITE_API_TIMEOUT', 30000),
  API_RETRY_COUNT: getEnvNumber('VITE_API_RETRY_COUNT', 3),

  // 功能开关
  ENABLE_DEVTOOLS: getEnvBoolean('VITE_ENABLE_DEVTOOLS', import.meta.env.DEV),
  ENABLE_ANALYTICS: getEnvBoolean('VITE_ENABLE_ANALYTICS', false),
  ENABLE_ERROR_REPORTING: getEnvBoolean('VITE_ENABLE_ERROR_REPORTING', false),
  ENABLE_PERFORMANCE_MONITORING: getEnvBoolean(
    'VITE_ENABLE_PERFORMANCE_MONITORING',
    true
  ),

  // 开发和调试配置
  DEV_MODE: getEnvBoolean('VITE_DEV_MODE', import.meta.env.DEV),
  ENABLE_MOCK: getEnvBoolean('VITE_ENABLE_MOCK', false),
  ENABLE_DEBUG: getEnvBoolean('VITE_ENABLE_DEBUG', import.meta.env.DEV),

  // 构建配置
  BUILD_TARGET: getEnvVar('VITE_BUILD_TARGET', 'es2020'),
  BUNDLE_ANALYZER: getEnvBoolean('VITE_BUNDLE_ANALYZER', false),
  ENABLE_ANALYZE: getEnvBoolean('VITE_ENABLE_ANALYZE', false),

  // 缓存配置
  CACHE_DURATION: getEnvNumber('VITE_CACHE_DURATION', 300000), // 5分钟

  // 安全配置
  ENABLE_CSP: getEnvBoolean('VITE_ENABLE_CSP', true),
  ENABLE_HTTPS_ONLY: getEnvBoolean(
    'VITE_ENABLE_HTTPS_ONLY',
    import.meta.env.PROD
  ),

  // 监控配置
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
  ANALYTICS_ID: import.meta.env.VITE_ANALYTICS_ID,

  // 业务配置
  EXPIRY_WARNING_DAYS: getEnvNumber('VITE_EXPIRY_WARNING_DAYS', 30),
  LOW_STOCK_THRESHOLD: getEnvNumber('VITE_LOW_STOCK_THRESHOLD', 10),
  SCANNER_TIMEOUT: getEnvNumber('VITE_SCANNER_TIMEOUT', 30000),
  SCANNER_RETRY_COUNT: getEnvNumber('VITE_SCANNER_RETRY_COUNT', 3),
};

// 环境检查
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// 功能检查
export const isDevToolsEnabled = env.ENABLE_DEVTOOLS && isDevelopment;
export const isAnalyticsEnabled = env.ENABLE_ANALYTICS && isProduction;
export const isErrorReportingEnabled = env.ENABLE_ERROR_REPORTING;
export const isPerformanceMonitoringEnabled = env.ENABLE_PERFORMANCE_MONITORING;

// 环境信息
export const getEnvironmentInfo = () => ({
  nodeEnv: env.NODE_ENV,
  appName: env.APP_NAME,
  appVersion: env.APP_VERSION,
  appEnv: env.APP_ENV,
  buildTime: import.meta.env.VITE_BUILD_TIME || new Date().toISOString(),
  isDevelopment,
  isProduction,
  isTest,
  features: {
    devtools: isDevToolsEnabled,
    analytics: isAnalyticsEnabled,
    errorReporting: isErrorReportingEnabled,
    performanceMonitoring: isPerformanceMonitoringEnabled,
  },
});

// 配置验证
export const validateConfig = (): void => {
  try {
    validateEnvironment();

    // 开发环境下输出配置信息
    if (isDevelopment) {
      console.log('Environment Configuration:', getEnvironmentInfo());
    }
  } catch (error) {
    console.error('Environment validation failed:', error);
    throw error;
  }
};

// 获取 API 基础 URL
export const getApiBaseUrl = (): string => {
  if (env.API_BASE_URL) {
    return env.API_BASE_URL;
  }

  // 根据环境自动推断
  if (isProduction) {
    return `${env.SUPABASE_URL}/rest/v1`;
  }

  return `${env.SUPABASE_URL}/rest/v1`;
};

// 获取完整的应用 URL
export const getAppUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // 服务端渲染或构建时
  return env.API_BASE_URL || 'http://localhost:3000';
};

// 导出默认配置
export default env;

// 初始化时验证配置
validateConfig();
