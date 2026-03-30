/**
 * React Query 客户端配置
 * 配置查询客户端、缓存策略和错误处理
 */

import { QueryClient } from '@tanstack/react-query';

import { useNotificationStore } from '../stores/notification.store';

// 定义错误类型接口
interface ApiError {
  status?: number;
  statusCode?: number;
  message?: string;
  error_description?: string;
}

// 默认查询选项
const defaultOptions = {
  queries: {
    // 数据过期时间 - 根据数据类型设置不同的过期时间
    staleTime: 5 * 60 * 1000, // 5分钟 - 默认值
    // 垃圾回收时间 - 10分钟
    gcTime: 10 * 60 * 1000,
    // 重试策略
    retry: (failureCount: number, error: unknown) => {
      // 404 错误不重试
      if (
        (error as { status?: number; statusCode?: number })?.status === 404 ||
        (error as { status?: number; statusCode?: number })?.statusCode === 404
      ) {
        return false;
      }
      // 认证错误不重试
      if (
        (error as { status?: number; statusCode?: number })?.status === 401 ||
        (error as { status?: number; statusCode?: number })?.statusCode === 401
      ) {
        return false;
      }
      // 权限错误不重试
      if (
        (error as ApiError)?.status === 403 ||
        (error as ApiError)?.statusCode === 403
      ) {
        return false;
      }
      // 最多重试3次
      return failureCount < 3;
    },
    // 重试延迟 - 指数退避
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
    // 窗口聚焦时不自动重新获取
    refetchOnWindowFocus: false,
    // 网络重连时重新获取
    refetchOnReconnect: true,
    // 组件挂载时不自动重新获取（除非数据过期）
    refetchOnMount: true,
    // 网络模式 - 在线时才获取数据
    networkMode: 'online' as const,
  },
  mutations: {
    // 全局错误处理
    onError: (error: unknown) => {
      console.error('Mutation error:', error);

      // 获取通知 store
      const notificationStore = useNotificationStore.getState();

      // 根据错误类型显示不同的通知
      let title = '操作失败';
      let message = '请稍后重试';

      if ((error as ApiError)?.message) {
        message = (error as ApiError).message || '请稍后重试';
      } else if ((error as ApiError)?.error_description) {
        message = (error as ApiError).error_description || '请稍后重试';
      } else if (typeof error === 'string') {
        message = error;
      }

      // 根据状态码设置标题
      const apiError = error as ApiError;
      if (apiError?.status === 401 || apiError?.statusCode === 401) {
        title = '认证失败';
        message = '请重新登录';
      } else if (apiError?.status === 403 || apiError?.statusCode === 403) {
        title = '权限不足';
        message = '您没有执行此操作的权限';
      } else if (apiError?.status === 404 || apiError?.statusCode === 404) {
        title = '资源不存在';
        message = '请求的资源未找到';
      } else if (
        (apiError?.status && apiError.status >= 500) ||
        (apiError?.statusCode && apiError.statusCode >= 500)
      ) {
        title = '服务器错误';
        message = '服务器暂时不可用，请稍后重试';
      }

      notificationStore.addNotification({
        type: 'error',
        title,
        message,
        priority: 'high',
        persistent: true,
      });
    },
    // 全局成功处理
    onSuccess: (data: unknown, variables: unknown, context: unknown) => {
      // 可以在这里添加全局成功处理逻辑
      console.log('Mutation success:', { data, variables, context });
    },
  },
};

// 创建查询客户端
export const queryClient = new QueryClient({
  defaultOptions,
});

// 性能优化配置
export const performanceConfig = {
  // 不同数据类型的缓存策略
  cacheStrategies: {
    // 静态数据 - 长时间缓存
    static: {
      staleTime: 30 * 60 * 1000, // 30分钟
      gcTime: 60 * 60 * 1000, // 1小时
    },
    // 用户数据 - 中等缓存
    user: {
      staleTime: 10 * 60 * 1000, // 10分钟
      gcTime: 20 * 60 * 1000, // 20分钟
    },
    // 库存数据 - 短时间缓存
    inventory: {
      staleTime: 2 * 60 * 1000, // 2分钟
      gcTime: 5 * 60 * 1000, // 5分钟
    },
    // 实时数据 - 最短缓存
    realtime: {
      staleTime: 30 * 1000, // 30秒
      gcTime: 60 * 1000, // 1分钟
    },
  },

  // 预取策略
  prefetchStrategies: {
    // 关键数据预取时间
    critical: 10 * 60 * 1000, // 10分钟
    // 常用数据预取时间
    common: 5 * 60 * 1000, // 5分钟
    // 可选数据预取时间
    optional: 2 * 60 * 1000, // 2分钟
  },
};

// 查询键工厂 - 统一管理查询键
export const queryKeys = {
  // 认证相关
  auth: {
    user: () => ['auth', 'user'] as const,
    session: () => ['auth', 'session'] as const,
  },

  // 药品相关
  medicines: {
    all: () => ['medicines'] as const,
    lists: () => [...queryKeys.medicines.all(), 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.medicines.lists(), filters] as const,
    details: () => [...queryKeys.medicines.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.medicines.details(), id] as const,
    search: (query: string) =>
      [...queryKeys.medicines.all(), 'search', query] as const,
  },

  // 批次相关
  batches: {
    all: () => ['batches'] as const,
    lists: () => [...queryKeys.batches.all(), 'list'] as const,
    list: (medicineId?: string) =>
      [...queryKeys.batches.lists(), medicineId] as const,
    details: () => [...queryKeys.batches.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.batches.details(), id] as const,
    byMedicine: (medicineId: string) =>
      [...queryKeys.batches.all(), 'medicine', medicineId] as const,
  },

  // 库存相关
  inventory: {
    all: () => ['inventory'] as const,
    summary: () => [...queryKeys.inventory.all(), 'summary'] as const,
    transactions: () => [...queryKeys.inventory.all(), 'transactions'] as const,
    transaction: (id: string) =>
      [...queryKeys.inventory.transactions(), id] as const,
    lowStock: () => [...queryKeys.inventory.all(), 'low-stock'] as const,
    expiring: (days?: number) =>
      [...queryKeys.inventory.all(), 'expiring', days] as const,
  },

  // 报表相关
  reports: {
    all: () => ['reports'] as const,
    consumption: (params?: Record<string, unknown>) =>
      [...queryKeys.reports.all(), 'consumption', params] as const,
    stock: (params?: Record<string, unknown>) =>
      [...queryKeys.reports.all(), 'stock', params] as const,
    transactions: (params?: Record<string, unknown>) =>
      [...queryKeys.reports.all(), 'transactions', params] as const,
  },

  // 用户相关
  users: {
    all: () => ['users'] as const,
    lists: () => [...queryKeys.users.all(), 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },

  // 系统设置相关
  settings: {
    all: () => ['settings'] as const,
    system: () => [...queryKeys.settings.all(), 'system'] as const,
    user: (userId: string) =>
      [...queryKeys.settings.all(), 'user', userId] as const,
  },
} as const;

// 查询客户端工具函数
export const queryUtils = {
  // 使查询无效
  invalidateQueries: (queryKey: unknown[]) => {
    return queryClient.invalidateQueries({ queryKey });
  },

  // 重置查询
  resetQueries: (queryKey: unknown[]) => {
    return queryClient.resetQueries({ queryKey });
  },

  // 预取查询
  prefetchQuery: (
    queryKey: unknown[],
    queryFn: () => Promise<unknown>,
    staleTime?: number
  ) => {
    return queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: staleTime || 10 * 60 * 1000, // 默认10分钟
    });
  },

  // 设置查询数据
  setQueryData: (queryKey: unknown[], data: unknown) => {
    return queryClient.setQueryData(queryKey, data);
  },

  // 获取查询数据
  getQueryData: (queryKey: unknown[]) => {
    return queryClient.getQueryData(queryKey);
  },

  // 移除查询
  removeQueries: (queryKey: unknown[]) => {
    return queryClient.removeQueries({ queryKey });
  },

  // 取消查询
  cancelQueries: (queryKey: unknown[]) => {
    return queryClient.cancelQueries({ queryKey });
  },
};

// 错误处理工具
export const handleQueryError = (error: unknown, context?: string) => {
  console.error(`Query error${context ? ` in ${context}` : ''}:`, error);

  const notificationStore = useNotificationStore.getState();

  let title = '数据获取失败';
  let message = '请检查网络连接后重试';

  if ((error as ApiError)?.message) {
    message = (error as ApiError).message || '请检查网络连接后重试';
  } else if ((error as ApiError)?.error_description) {
    message = (error as ApiError).error_description || '请检查网络连接后重试';
  }

  const apiError = error as ApiError;
  if (apiError?.status === 401 || apiError?.statusCode === 401) {
    title = '认证失败';
    message = '请重新登录';
  } else if (apiError?.status === 403 || apiError?.statusCode === 403) {
    title = '权限不足';
    message = '您没有访问此数据的权限';
  } else if (apiError?.status === 404 || apiError?.statusCode === 404) {
    title = '数据不存在';
    message = '请求的数据未找到';
  } else if (
    (apiError?.status && apiError.status >= 500) ||
    (apiError?.statusCode && apiError.statusCode >= 500)
  ) {
    title = '服务器错误';
    message = '服务器暂时不可用，请稍后重试';
  }

  notificationStore.addNotification({
    type: 'error',
    title,
    message,
    priority: 'medium',
    duration: 5000,
  });
};

// 成功处理工具
export const handleQuerySuccess = (
  message: string,
  title: string = '操作成功'
) => {
  const notificationStore = useNotificationStore.getState();

  notificationStore.addNotification({
    type: 'success',
    title,
    message,
    priority: 'medium',
    duration: 3000,
  });
};

// 查询状态工具
export const getQueryStatus = (isLoading: boolean, isError: boolean) => {
  if (isLoading) return 'loading';
  if (isError) return 'error';
  return 'success';
};

// 乐观更新工具
export const createOptimisticUpdate = <T>(
  queryKey: unknown[],
  updateFn: (oldData: T) => T
) => {
  return {
    onMutate: async () => {
      // 取消正在进行的查询
      await queryClient.cancelQueries({ queryKey });

      // 获取之前的数据
      const previousData = queryClient.getQueryData<T>(queryKey);

      // 乐观更新
      if (previousData) {
        queryClient.setQueryData(queryKey, updateFn(previousData));
      }

      return { previousData };
    },
    onError: (
      _err: unknown,
      _variables: unknown,
      context: { previousData?: T }
    ) => {
      // 回滚到之前的数据
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      // 重新获取数据
      queryClient.invalidateQueries({ queryKey });
    },
  };
};

// 性能优化工具
export const performanceUtils = {
  // 批量预取查询
  batchPrefetch: async (
    prefetchConfigs: Array<{
      queryKey: unknown[];
      queryFn: () => Promise<unknown>;
      staleTime?: number;
    }>
  ) => {
    const promises = prefetchConfigs.map(config =>
      queryClient.prefetchQuery({
        queryKey: config.queryKey,
        queryFn: config.queryFn,
        staleTime:
          config.staleTime || performanceConfig.prefetchStrategies.common,
      })
    );

    await Promise.allSettled(promises);
  },

  // 智能缓存失效
  smartInvalidate: (patterns: string[]) => {
    patterns.forEach(pattern => {
      queryClient.invalidateQueries({
        predicate: query => {
          const queryKey = query.queryKey as string[];
          return queryKey.some(
            key => typeof key === 'string' && key.includes(pattern)
          );
        },
      });
    });
  },

  // 内存清理
  cleanupMemory: () => {
    // 清理过期的查询
    queryClient.getQueryCache().clear();
    // 强制垃圾回收（如果支持）
    if (window.gc) {
      window.gc();
    }
  },

  // 获取缓存统计
  getCacheStats: () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
      staleQueries: queries.filter(q => q.isStale()).length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
      memoryUsage: queries.reduce((acc, q) => {
        const data = q.state.data;
        return acc + (data ? JSON.stringify(data).length : 0);
      }, 0),
    };
  },

  // 预热关键数据
  warmupCriticalData: async () => {
    const criticalQueries = [
      {
        queryKey: [...queryKeys.auth.user()],
        queryFn: async () => {
          // 这里应该是获取用户信息的实际函数
          return null;
        },
      },
      {
        queryKey: [...queryKeys.medicines.lists()],
        queryFn: async () => {
          // 这里应该是获取药品列表的实际函数
          return [];
        },
      },
    ];

    await performanceUtils.batchPrefetch(criticalQueries);
  },
};

// 查询性能监控
export const queryPerformanceMonitor = {
  // 监控慢查询
  monitorSlowQueries: (threshold: number = 2000) => {
    const cache = queryClient.getQueryCache();

    cache.subscribe(event => {
      if (event?.type === 'updated' && event.query) {
        const query = event.query;
        const duration =
          query.state.dataUpdatedAt -
          ((query.state as { fetchFailureTime?: number }).fetchFailureTime ||
            query.state.dataUpdatedAt ||
            0);

        if (duration > threshold) {
          console.warn(`慢查询检测:`, {
            queryKey: query.queryKey,
            duration: `${duration}ms`,
            status: query.state.status,
          });
        }
      }
    });
  },

  // 监控内存使用
  monitorMemoryUsage: (interval: number = 30000) => {
    setInterval(() => {
      const stats = performanceUtils.getCacheStats();

      if (stats.memoryUsage > 10 * 1024 * 1024) {
        // 10MB
        console.warn('查询缓存内存使用过高:', stats);
      }

      // 开发环境下输出统计信息
      if (import.meta.env.DEV) {
        console.log('查询缓存统计:', stats);
      }
    }, interval);
  },
};
