import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 格式化日期
 */
export function formatDate(date: string | Date): string {
  let d: Date;
  if (typeof date === 'string') {
    // 使用本地时区解析日期字符串，避免 UTC 偏移导致的前一天问题
    d = new Date(date + 'T00:00:00');
  } else {
    // Date 对象直接使用 UTC 方法获取日期组件
    d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }
  return d.toLocaleDateString('zh-CN', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * 格式化日期时间
 */
export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 计算剩余天数
 */
export function getDaysUntilExpiry(expiryDate: string | Date): number {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 计算两个日期之间的天数
 */
export function getDaysUntil(targetDate: string | Date): number {
  const target = new Date(targetDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 获取库存状态
 */
export function getStockStatus(
  currentStock: number,
  safetyStock: number
): 'sufficient' | 'low' | 'empty' {
  if (currentStock === 0) return 'empty';
  if (currentStock <= safetyStock) return 'low';
  return 'sufficient';
}

/**
 * 获取近效期状态
 */
export function getExpiryStatus(
  expiryDate: string | Date,
  warningDays: number = 30
): 'normal' | 'expiring' | 'expired' {
  const daysUntilExpiry = getDaysUntilExpiry(expiryDate);

  if (daysUntilExpiry <= 0) return 'expired';
  if (daysUntilExpiry <= warningDays) return 'expiring';
  return 'normal';
}

/**
 * 计算多批次药品的综合有效期状态
 */
export function getMultiBatchExpiryStatus(
  batches: Array<{ expiry_date: string; quantity: number }>,
  warningDays: number = 30
): 'normal' | 'expiring' | 'expired' {
  const activeBatches = batches.filter(batch => batch.quantity > 0);

  if (activeBatches.length === 0) return 'normal';

  // 检查是否有已过期的批次
  const hasExpiredBatches = activeBatches.some(
    batch => getExpiryStatus(batch.expiry_date, warningDays) === 'expired'
  );

  if (hasExpiredBatches) return 'expired';

  // 检查是否有近效期批次
  const hasExpiringBatches = activeBatches.some(
    batch => getExpiryStatus(batch.expiry_date, warningDays) === 'expiring'
  );

  if (hasExpiringBatches) return 'expiring';

  return 'normal';
}

/**
 * 生成随机ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
