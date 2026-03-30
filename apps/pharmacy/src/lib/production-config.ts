/**
 * 生产环境专用配置
 * 针对生产部署的特定配置
 */

import { env } from './env';

// 生产环境配置
export const productionConfig = {
  // API 配置
  api: {
    timeout: 15000, // 增加超时时间
    retryCount: 3,
    retryDelay: 1000,
  },

  // 认证配置
  auth: {
    sessionTimeout: 3600, // 1小时
    refreshThreshold: 300, // 5分钟前刷新
    maxRetries: 3,
    storageKey: 'pharmacy-auth-production',
  },

  // 静态资源配置
  assets: {
    iconPath: '/icons',
    manifestPath: '/manifest.json',
    serviceWorkerPath: '/sw.js',
  },

  // 错误处理配置
  errorHandling: {
    enableConsoleLogging: false, // 生产环境关闭详细日志
    enableErrorReporting: true,
    maxErrorRetries: 3,
  },

  // 缓存配置
  cache: {
    staticAssets: 86400, // 24小时
    apiResponses: 300, // 5分钟
    userSession: 3600, // 1小时
  },
};

/**
 * 检查是否为生产环境
 */
export function isProductionEnvironment(): boolean {
  return env.NODE_ENV === 'production' || env.APP_ENV === 'production';
}

/**
 * 获取当前环境的基础URL
 */
export function getBaseUrl(): string {
  if (isProductionEnvironment()) {
    return window.location.origin;
  }
  return window.location.origin;
}

/**
 * 获取静态资源URL
 */
export function getAssetUrl(path: string): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
}

/**
 * 生产环境错误处理
 */
export function handleProductionError(error: unknown, context: string): void {
  if (isProductionEnvironment()) {
    // 生产环境只记录必要信息
    console.error(`[${context}] Error occurred`);

    // 可以在这里集成错误监控服务
    if (productionConfig.errorHandling.enableErrorReporting) {
      // 发送错误报告到监控服务
      reportError(error, context);
    }
  } else {
    // 开发环境显示详细错误
    console.error(`[${context}] Error:`, error);
  }
}

/**
 * 发送错误报告（占位符函数）
 */
function reportError(error: unknown, context: string): void {
  // 这里可以集成 Sentry、LogRocket 等错误监控服务
  console.log('Error reported:', { error, context });
}

/**
 * 生产环境网络请求配置
 */
export function getNetworkConfig() {
  return {
    timeout: productionConfig.api.timeout,
    retries: productionConfig.api.retryCount,
    retryDelay: productionConfig.api.retryDelay,
    headers: {
      'X-Environment': isProductionEnvironment() ? 'production' : 'development',
      'X-Domain': window.location.hostname,
      'X-User-Agent': navigator.userAgent,
    },
  };
}

/**
 * 检查资源是否可访问
 */
export async function checkResourceAvailability(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      cache: 'no-cache',
    });
    return response.ok;
  } catch (error) {
    handleProductionError(error, 'resource-check');
    return false;
  }
}

/**
 * 预加载关键资源
 */
export async function preloadCriticalResources(): Promise<void> {
  if (!isProductionEnvironment()) {
    return;
  }

  const criticalResources = [
    '/icons/favicon.ico',
    '/icons/apple-touch-icon.png',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/manifest.json',
  ];

  const preloadPromises = criticalResources.map(async resource => {
    const url = getAssetUrl(resource);
    const isAvailable = await checkResourceAvailability(url);

    if (!isAvailable) {
      console.warn(`Critical resource not available: ${url}`);
    }

    return isAvailable;
  });

  try {
    const results = await Promise.all(preloadPromises);
    const availableCount = results.filter(Boolean).length;

    console.log(
      `Preloaded ${availableCount}/${criticalResources.length} critical resources`
    );
  } catch (error) {
    handleProductionError(error, 'preload-resources');
  }
}

/**
 * 生产环境初始化
 */
export async function initializeProductionEnvironment(): Promise<void> {
  if (!isProductionEnvironment()) {
    return;
  }

  console.log('🏭 Initializing production environment...');

  try {
    // 1. 预加载关键资源
    await preloadCriticalResources();

    // 2. 设置错误处理
    window.addEventListener('error', event => {
      handleProductionError(event.error, 'global-error');
    });

    window.addEventListener('unhandledrejection', event => {
      handleProductionError(event.reason, 'unhandled-rejection');
    });

    // 3. 设置性能监控
    if ('performance' in window) {
      // 监控页面加载性能
      window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;
        console.log(
          'Page load time:',
          perfData.loadEventEnd - perfData.fetchStart,
          'ms'
        );
      });
    }

    console.log('✅ Production environment initialized');
  } catch (error) {
    handleProductionError(error, 'production-init');
  }
}

/**
 * 获取生产环境状态
 */
export function getProductionStatus() {
  return {
    isProduction: isProductionEnvironment(),
    domain: window.location.hostname,
    baseUrl: getBaseUrl(),
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  };
}
