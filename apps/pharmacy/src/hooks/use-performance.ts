/**
 * 性能优化相关的 React Hooks
 * 提供组件级别的性能优化工具
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { debounce, throttle } from '../lib/utils';

/**
 * 防抖 Hook - 延迟更新值，避免频繁更新
 * @param value 需要防抖的值
 * @param delay 延迟时间（毫秒）
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * 节流 Hook - 限制值更新频率
 * @param value 需要节流的值
 * @param limit 限制时间（毫秒）
 */
export const useThrottle = <T>(value: T, limit: number): T => {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(
      () => {
        if (Date.now() - lastRan.current >= limit) {
          setThrottledValue(value);
          lastRan.current = Date.now();
        }
      },
      limit - (Date.now() - lastRan.current)
    );

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
};

/**
 * 防抖回调 Hook - 延迟执行回调函数
 * @param callback 需要防抖的回调函数
 * @param delay 延迟时间（毫秒）
 */
export const useDebouncedCallback = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useMemo(() => {
    return debounce((...args: unknown[]) => {
      callbackRef.current(...(args as Parameters<T>));
    }, delay) as T;
  }, [delay]);
};

/**
 * 节流回调 Hook - 限制回调函数执行频率
 * @param callback 需要节流的回调函数
 * @param limit 限制时间（毫秒）
 */
export const useThrottledCallback = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  limit: number
): T => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useMemo(() => {
    return throttle((...args: unknown[]) => {
      callbackRef.current(...(args as Parameters<T>));
    }, limit) as T;
  }, [limit]);
};

/**
 * 虚拟滚动 Hook - 优化长列表渲染性能
 * @param items 完整列表数据
 * @param itemHeight 每项高度（像素）
 * @param containerHeight 容器高度（像素）
 */
export const useVirtualScroll = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight,
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    ...visibleItems,
    handleScroll,
  };
};

/**
 * 懒加载 Hook - 元素进入视口时触发加载
 * @param threshold 视口边缘扩展像素（正值提前触发，负值延迟触发）
 */
export const useLazyLoad = (threshold: number = 100) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!window.IntersectionObserver) {
      // 降级处理：不支持 IntersectionObserver 的浏览器直接显示
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: `${threshold}px`,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
};

/**
 * 图片懒加载 Hook - 优化图片加载性能
 * @param src 图片源地址
 * @param placeholder 占位图片地址（可选）
 */
export const useImageLazyLoad = (src: string, placeholder?: string) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const { ref, isVisible } = useLazyLoad();

  useEffect(() => {
    if (isVisible && src) {
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      img.onerror = () => {
        setIsError(true);
      };
      img.src = src;
    }
  }, [isVisible, src]);

  return {
    ref,
    src: imageSrc,
    isLoaded,
    isError,
    isVisible,
  };
};

/**
 * 网络状态监控 Hook - 监控网络连接状态
 */
export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<{
    online: boolean;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  }>({
    online: navigator.onLine,
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = (
        navigator as Navigator & {
          connection?: {
            effectiveType?: string;
            downlink?: number;
            rtt?: number;
          };
        }
      ).connection;
      setNetworkStatus({
        online: navigator.onLine,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt,
      });
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    if ('connection' in navigator) {
      const connection = (
        navigator as Navigator & {
          connection?: EventTarget & {
            effectiveType?: string;
            downlink?: number;
            rtt?: number;
          };
        }
      ).connection;
      connection?.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      if ('connection' in navigator) {
        const connection = (
          navigator as Navigator & { connection?: EventTarget }
        ).connection;
        connection?.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);

  return networkStatus;
};

/**
 * 批量操作 Hook - 优化大量数据处理
 * @param batchSize 每批处理的数据量
 * @param delay 批次间延迟（毫秒）
 */
export const useBatchOperation = <T>(
  batchSize: number = 10,
  delay: number = 100
) => {
  const [queue, setQueue] = useState<T[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);

  const addToQueue = useCallback((items: T | T[]) => {
    const itemsArray = Array.isArray(items) ? items : [items];
    setQueue(prev => [...prev, ...itemsArray]);
  }, []);

  const processBatch = useCallback(
    async (processor: (batch: T[]) => Promise<void>) => {
      if (processingRef.current || queue.length === 0) return;

      processingRef.current = true;
      setIsProcessing(true);

      try {
        while (queue.length > 0) {
          const batch = queue.splice(0, batchSize);
          await processor(batch);

          if (delay > 0 && queue.length > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      } finally {
        processingRef.current = false;
        setIsProcessing(false);
        setQueue([]);
      }
    },
    [queue, batchSize, delay]
  );

  return {
    queue,
    queueSize: queue.length,
    isProcessing,
    addToQueue,
    processBatch,
    clearQueue: () => setQueue([]),
  };
};
