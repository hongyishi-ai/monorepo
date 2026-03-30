import * as Sentry from '@sentry/react';
import type { StateCreator } from 'zustand';

// Sentry 配置
export const initSentry = () => {
  Sentry.init({
    // 在生产环境中，您需要设置真实的 DSN
    // dsn: "YOUR_SENTRY_DSN_HERE",
    
    // 开发环境下使用空 DSN 或配置本地测试
    dsn: import.meta.env.VITE_SENTRY_DSN || '',
    
    environment: import.meta.env.MODE,
    
    // 简化的集成配置
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    
    // 性能监控
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    
    // 在开发环境启用调试
    debug: !import.meta.env.PROD,
    
    // 忽略一些常见的非关键错误
    ignoreErrors: [
      'Non-Error promise rejection captured',
      'ResizeObserver loop limit exceeded',
      'Network Error',
      'NetworkError',
      'ChunkLoadError',
    ],
    
    beforeSend(event) {
      // 在开发环境下，将错误也输出到控制台
      if (!import.meta.env.PROD) {
        console.error('Sentry captured error:', event);
      }
      
      return event;
    },
  });
};

// Store 错误监控中间件
export const sentryMiddleware = <T extends object>(
  f: StateCreator<T, [], [], T>,
): StateCreator<T, [], [], T> => (set, get, api) => {
  const sentrySet = (partial: any, replace?: any) => {
    try {
      return set(partial, replace);
    } catch (error) {
      // 捕获 store 操作中的错误
      Sentry.captureException(error, {
        tags: {
          component: 'zustand-store',
          action: 'state-update'
        },
        extra: {
          currentState: get(),
        }
      });
      throw error;
    }
  };

  try {
    return f(sentrySet, get, api);
  } catch (error) {
    // 捕获 store 初始化错误
    Sentry.captureException(error, {
      tags: {
        component: 'zustand-store',
        action: 'initialization'
      }
    });
    throw error;
  }
};

// 手动错误报告工具
export const reportError = (error: Error, context?: {
  action?: string;
  component?: string;
  userId?: string;
  extra?: Record<string, any>;
}) => {
  Sentry.captureException(error, {
    tags: {
      component: context?.component || 'unknown',
      action: context?.action || 'unknown'
    },
    user: context?.userId ? { id: context.userId } : undefined,
    extra: context?.extra || {}
  });
};

// 用户上下文设置
export const setUserContext = (user: { id?: string; email?: string; username?: string }) => {
  Sentry.setUser(user);
};

// 添加面包屑
export const addBreadcrumb = (message: string, category?: string, data?: any) => {
  Sentry.addBreadcrumb({
    message,
    category: category || 'custom',
    level: 'info',
    data
  });
};

// Store 状态监控钩子
export const useStoreMonitoring = (storeName: string) => {
  return {
    logStateChange: (action: string, changes: Record<string, any>) => {
      Sentry.addBreadcrumb({
        category: 'state-change',
        message: `${storeName}: ${action}`,
        level: 'info',
        data: {
          store: storeName,
          action,
          changes,
          timestamp: new Date().toISOString()
        }
      });
    },
    
    logError: (error: Error, action: string) => {
      Sentry.captureException(error, {
        tags: {
          component: storeName,
          action: action
        }
      });
    }
  };
};

export default Sentry; 