import { reportError, addBreadcrumb } from '@/lib/sentry';

// 简化的 store 监控工具
export const createStoreMonitor = (storeName: string) => {
  return {
    // 记录操作
    logAction: (action: string, data?: any) => {
      addBreadcrumb(`${storeName}: ${action}`, 'store-action', {
        store: storeName,
        action,
        data,
        timestamp: new Date().toISOString()
      });
    },

    // 错误报告
    logError: (error: Error, action: string, context?: any) => {
      reportError(error, {
        component: storeName,
        action,
        extra: context
      });
    },

    // 安全执行操作
    safeExecute: <T>(operation: () => T, actionName: string): T | null => {
      try {
        addBreadcrumb(`${storeName}: ${actionName}`, 'store-operation');
        return operation();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        reportError(err, {
          component: storeName,
          action: actionName
        });
        return null;
      }
    }
  };
}; 