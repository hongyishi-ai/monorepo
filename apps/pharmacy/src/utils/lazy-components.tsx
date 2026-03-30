/**
 * 懒加载组件工具
 * 提供统一的组件懒加载和错误处理
 */

/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Loader2 } from 'lucide-react';
import type { ComponentType } from 'react';
import React, { Suspense } from 'react';

// 加载状态组件
const LoadingSpinner = ({ message = '加载中...' }: { message?: string }) => (
  <div className='flex items-center justify-center min-h-[200px] w-full'>
    <div className='flex flex-col items-center gap-2'>
      <Loader2 className='h-8 w-8 animate-spin text-primary' />
      <p className='text-sm text-muted-foreground'>{message}</p>
    </div>
  </div>
);

// 页面级加载状态
const PageLoadingSpinner = ({
  message = '页面加载中...',
}: {
  message?: string;
}) => (
  <div className='flex items-center justify-center min-h-[400px] w-full'>
    <div className='flex flex-col items-center gap-3'>
      <Loader2 className='h-12 w-12 animate-spin text-primary' />
      <p className='text-lg font-medium text-foreground'>{message}</p>
      <p className='text-sm text-muted-foreground'>请稍候...</p>
    </div>
  </div>
);

// 错误边界组件
class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType },
  { hasError: boolean; error?: Error }
> {
  constructor(props: {
    children: React.ReactNode;
    fallback?: React.ComponentType;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('懒加载组件错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      if (FallbackComponent) {
        return <FallbackComponent />;
      }

      return (
        <div className='flex items-center justify-center min-h-[200px] w-full'>
          <div className='text-center'>
            <p className='text-lg font-medium text-destructive mb-2'>
              组件加载失败
            </p>
            <p className='text-sm text-muted-foreground mb-4'>
              {this.state.error?.message || '未知错误'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className='px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90'
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 创建懒加载组件的高阶函数
 * @param importFn 动态导入函数
 * @param options 配置选项
 */

export function createLazyComponent(
  importFn: () => Promise<{ default: ComponentType<any> }>,
  options: {
    fallback?: React.ComponentType;
    loadingMessage?: string;
    isPage?: boolean;
  } = {}
) {
  const LazyComponent = React.lazy(importFn as any);

  const WrappedComponent = (props: any) => {
    const LoadingComponent = options.isPage
      ? PageLoadingSpinner
      : LoadingSpinner;

    return (
      <LazyErrorBoundary fallback={options.fallback}>
        <Suspense
          fallback={<LoadingComponent message={options.loadingMessage} />}
        >
          <LazyComponent {...props} />
        </Suspense>
      </LazyErrorBoundary>
    );
  };

  // 保持组件名称用于调试
  WrappedComponent.displayName = `Lazy(Component)`;

  return WrappedComponent;
}

/**
 * 预加载组件
 * @param importFn 动态导入函数
 */
export function preloadComponent(
  importFn: () => Promise<{ default: ComponentType<any> }>
) {
  // 在浏览器空闲时预加载
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      importFn().catch(error => {
        console.warn('组件预加载失败:', error);
      });
    });
  } else {
    // 降级到 setTimeout
    setTimeout(() => {
      importFn().catch(error => {
        console.warn('组件预加载失败:', error);
      });
    }, 100);
  }
}

/**
 * 批量预加载组件
 * @param importFns 动态导入函数数组
 */
export function preloadComponents(
  importFns: Array<() => Promise<{ default: ComponentType<any> }>>
) {
  importFns.forEach((importFn, index) => {
    // 错开预加载时间，避免同时加载太多资源
    setTimeout(() => {
      preloadComponent(importFn);
    }, index * 50);
  });
}

/**
 * 智能预加载 - 基于用户行为预加载可能需要的组件
 */
export const smartPreloader = {
  // 鼠标悬停时预加载
  onHover: (importFn: () => Promise<{ default: ComponentType<any> }>) => {
    let isPreloaded = false;
    return {
      onMouseEnter: () => {
        if (!isPreloaded) {
          preloadComponent(importFn);
          isPreloaded = true;
        }
      },
    };
  },

  // 进入视口时预加载
  onIntersection: (
    importFn: () => Promise<{
      default: ComponentType<any>;
    }>,
    options: { threshold?: number; rootMargin?: string } = {}
  ) => {
    return (element: Element | null) => {
      if (!element) return;

      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              preloadComponent(importFn);
              observer.disconnect();
            }
          });
        },
        { threshold: 0.1, ...options }
      );

      observer.observe(element);
    };
  },

  // 路由变化时预加载相关组件
  onRouteChange: (
    routeComponentMap: Record<
      string,
      () => Promise<{ default: ComponentType<Record<string, unknown>> }>
    >
  ) => {
    return (currentRoute: string) => {
      // 预加载当前路由的相关组件
      const relatedRoutes = Object.keys(routeComponentMap).filter(
        route =>
          route.startsWith(currentRoute.split('/')[1]) && route !== currentRoute
      );

      relatedRoutes.forEach(route => {
        preloadComponent(routeComponentMap[route]);
      });
    };
  },
};

// 导出常用的加载组件
export { LazyErrorBoundary, LoadingSpinner, PageLoadingSpinner };
