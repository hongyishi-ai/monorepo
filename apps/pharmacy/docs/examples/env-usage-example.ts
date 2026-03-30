/**
 * 环境变量使用示例
 * 展示如何在应用中正确使用环境变量
 */

import { env, isDevelopment, isProduction } from '@/lib/env';

// ✅ 正确的环境变量使用方式

/**
 * 示例 1: 基础配置使用
 */
export function getAppConfig() {
  return {
    name: env.APP_NAME,
    version: env.APP_VERSION,
    environment: env.APP_ENV,
    isDev: isDevelopment,
    isProd: isProduction,
  };
}

/**
 * 示例 2: API 配置使用
 */
export function createApiConfig() {
  return {
    baseURL: env.SUPABASE_URL,
    timeout: env.API_TIMEOUT,
    retryCount: env.API_RETRY_COUNT,
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
    },
  };
}

/**
 * 示例 3: 功能开关使用
 */
export function getFeatureFlags() {
  return {
    enableDevtools: env.ENABLE_DEVTOOLS,
    enableAnalytics: env.ENABLE_ANALYTICS,
    enableDebug: env.ENABLE_DEBUG,
    enableMock: env.ENABLE_MOCK,
  };
}

/**
 * 示例 4: 业务配置使用
 */
export function getBusinessConfig() {
  return {
    expiryWarningDays: env.EXPIRY_WARNING_DAYS,
    lowStockThreshold: env.LOW_STOCK_THRESHOLD,
    scannerTimeout: env.SCANNER_TIMEOUT,
    scannerRetryCount: env.SCANNER_RETRY_COUNT,
  };
}

/**
 * 示例 5: 条件配置使用
 */
export function getConditionalConfig() {
  // 根据环境返回不同配置
  if (isDevelopment) {
    return {
      logLevel: 'debug',
      enableMock: true,
      apiTimeout: 60000, // 开发环境更长的超时时间
    };
  }

  if (isProduction) {
    return {
      logLevel: 'error',
      enableMock: false,
      apiTimeout: env.API_TIMEOUT,
    };
  }

  return {
    logLevel: 'info',
    enableMock: false,
    apiTimeout: env.API_TIMEOUT,
  };
}

/**
 * 示例 6: 安全配置使用
 */
export function getSecurityConfig() {
  return {
    enableCSP: env.ENABLE_CSP,
    enableHTTPSOnly: env.ENABLE_HTTPS_ONLY,
    // 注意: 敏感信息不应该暴露到客户端
    sentryDSN: env.SENTRY_DSN, // 这个是安全的，因为它是公开的
  };
}

// ❌ 错误的使用方式示例 (仅用于说明，不要这样做)

/**
 * 错误示例 1: 直接使用 import.meta.env (不推荐)
 */
export function badExample1() {
  // ❌ 不推荐: 直接使用，没有类型安全和默认值
  const url = import.meta.env.VITE_SUPABASE_URL;
  return url;
}

/**
 * 错误示例 2: 硬编码配置 (不推荐)
 */
export function badExample2() {
  // ❌ 不推荐: 硬编码，无法根据环境调整
  return {
    apiUrl: 'https://hardcoded-url.supabase.co',
    timeout: 30000,
  };
}

/**
 * 错误示例 3: 不安全的密钥使用 (危险)
 */
export function badExample3() {
  // ❌ 危险: 永远不要在客户端代码中使用 service role key
  // const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY; // 这会暴露敏感信息

  // ✅ 正确: 只使用 anon key
  const anonKey = env.SUPABASE_ANON_KEY;
  return anonKey;
}

// ✅ 最佳实践示例

/**
 * 最佳实践: 创建配置工厂函数
 */
export function createAppConfiguration() {
  // 验证必需的环境变量
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    throw new Error('Missing required Supabase configuration');
  }

  return {
    // 应用基础信息
    app: getAppConfig(),

    // API 配置
    api: createApiConfig(),

    // 功能开关
    features: getFeatureFlags(),

    // 业务配置
    business: getBusinessConfig(),

    // 安全配置
    security: getSecurityConfig(),

    // 环境特定配置
    environment: getConditionalConfig(),
  };
}

/**
 * 最佳实践: 配置验证函数
 */
export function validateConfiguration() {
  const config = createAppConfiguration();

  // 验证 URL 格式
  if (!config.api.baseURL.startsWith('https://')) {
    throw new Error('Supabase URL must use HTTPS');
  }

  // 验证数值范围
  if (
    config.business.expiryWarningDays < 1 ||
    config.business.expiryWarningDays > 365
  ) {
    throw new Error('Expiry warning days must be between 1 and 365');
  }

  if (config.business.lowStockThreshold < 0) {
    throw new Error('Low stock threshold must be non-negative');
  }

  return config;
}

// 导出验证后的配置
export const appConfig = validateConfiguration();

// 使用示例
console.log('App Configuration:', appConfig);
