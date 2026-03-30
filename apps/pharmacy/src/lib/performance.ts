/**
 * 性能优化工具
 * 提供性能监控和优化功能
 */

// Import web vitals functions - onFID replaced with onINP in v5.0
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

// 性能指标类型
export interface PerformanceMetrics {
  // 核心 Web Vitals
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  inp?: number; // Interaction to Next Paint (replaces FID in web-vitals v5.0)
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

/**
 * 性能优化工具集
 */
export const performanceUtils = {
  /**
   * 防抖函数 - 延迟执行函数，避免频繁调用
   * @param func 要执行的函数
   * @param wait 等待时间（毫秒）
   */
  debounce: <T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  /**
   * 节流函数 - 限制函数执行频率
   * @param func 要执行的函数
   * @param limit 限制时间（毫秒）
   */
  throttle: <T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let lastRun = 0;
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRun >= limit) {
        func(...args);
        lastRun = now;
      }
    };
  },

  /**
   * 延迟执行 - 在浏览器空闲时执行任务
   * @param callback 要执行的回调函数
   */
  defer: (callback: () => void) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback);
    } else {
      setTimeout(callback, 0);
    }
  },

  /**
   * 预加载资源 - 提前加载关键资源
   * @param url 资源URL
   * @param type 资源类型
   */
  preloadResource: (
    url: string,
    type: 'script' | 'style' | 'image' = 'script'
  ) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = type;
    document.head.appendChild(link);
  },

  /**
   * 获取设备信息 - 检测设备性能
   */
  getDeviceInfo: () => {
    const connection = (
      navigator as Navigator & {
        connection?: {
          effectiveType?: string;
          downlink?: number;
          rtt?: number;
        };
      }
    ).connection;

    const memory = (
      performance as Performance & {
        memory?: {
          usedJSHeapSize: number;
          totalJSHeapSize: number;
          jsHeapSizeLimit: number;
        };
      }
    ).memory;

    return {
      // 网络信息
      network: connection
        ? {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
          }
        : null,

      // 内存信息
      memory: memory
        ? {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit,
          }
        : null,

      // 硬件信息
      hardware: {
        cores: navigator.hardwareConcurrency || 1,
        platform: navigator.platform,
        userAgent: navigator.userAgent,
      },
    };
  },

  /**
   * 检测是否为低端设备
   */
  isLowEndDevice: (): boolean => {
    const deviceInfo = performanceUtils.getDeviceInfo();

    // 基于多个指标判断
    const lowEndIndicators = [
      // CPU 核心数少于 4
      deviceInfo.hardware.cores < 4,
      // 网络连接较慢
      deviceInfo.network?.effectiveType === '2g' ||
        deviceInfo.network?.effectiveType === 'slow-2g',
      // 内存限制较小
      deviceInfo.memory && deviceInfo.memory.limit < 1024 * 1024 * 1024, // 小于 1GB
    ];

    // 如果有 2 个或以上指标符合，认为是低端设备
    return lowEndIndicators.filter(Boolean).length >= 2;
  },
};

/**
 * 监控 Web Vitals 性能指标
 * @param onPerfEntry 性能指标回调函数
 */
export const reportWebVitals = (onPerfEntry?: (metric: unknown) => void) => {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    onFCP(onPerfEntry);
    onLCP(onPerfEntry);
    onINP(onPerfEntry); // Updated from onFID to onINP in web-vitals v5.0
    onCLS(onPerfEntry);
    onTTFB(onPerfEntry);
  }
};

/**
 * 组件性能监控 Hook (仅开发环境使用)
 * @param componentName 组件名称
 */
export const usePerformanceMonitor = (componentName: string) => {
  const startTime = performance.now();

  return {
    // 记录渲染时间
    recordRenderTime: () => {
      const renderTime = performance.now() - startTime;
      if (import.meta.env.DEV) {
        console.log(`${componentName} 渲染时间: ${renderTime.toFixed(2)}ms`);
      }
      return renderTime;
    },

    // 记录交互时间
    recordInteractionTime: (actionName: string) => {
      const interactionTime = performance.now() - startTime;
      if (import.meta.env.DEV) {
        console.log(
          `${componentName} ${actionName} 交互时间: ${interactionTime.toFixed(2)}ms`
        );
      }
      return interactionTime;
    },
  };
};
