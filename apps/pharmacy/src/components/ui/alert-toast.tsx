/**
 * Alert Toast 组件
 * 用于显示系统提醒的弹窗，5秒后自动消失
 */

import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export interface AlertToastProps {
  title: string;
  description: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number; // 持续时间，毫秒
  onClose?: () => void;
  className?: string;
}

const alertIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const alertStyles = {
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  success: 'border-green-200 bg-green-50 text-green-800',
  warning: 'border-orange-200 bg-orange-50 text-orange-800',
  error: 'border-red-200 bg-red-50 text-red-800',
};

export function AlertToast({
  title,
  description,
  type = 'info',
  duration = 5000,
  onClose,
  className,
}: AlertToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClose = useCallback(() => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300); // 等待动画完成
  }, [onClose]);

  useEffect(() => {
    // 开始动画
    setIsAnimating(true);

    // 设置自动关闭定时器
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, handleClose]);

  if (!isVisible) return null;

  const Icon = alertIcons[type];

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 w-96 max-w-sm transition-all duration-300 ease-in-out',
        isAnimating
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0',
        className
      )}
    >
      <Alert className={cn('shadow-lg border', alertStyles[type])}>
        <div className='flex items-start justify-between'>
          <div className='flex items-start space-x-2'>
            <Icon className='h-4 w-4 mt-0.5' />
            <div className='flex-1'>
              <AlertTitle className='text-sm font-medium'>{title}</AlertTitle>
              <AlertDescription className='text-xs mt-1'>
                {description}
              </AlertDescription>
            </div>
          </div>
          <button
            onClick={handleClose}
            className='ml-2 p-1 rounded-full hover:bg-black/10 transition-colors'
            aria-label='关闭提醒'
          >
            <X className='h-3 w-3' />
          </button>
        </div>
      </Alert>
    </div>
  );
}

// Toast 管理器
interface ToastItem extends AlertToastProps {
  id: string;
}

class ToastManager {
  private toasts: ToastItem[] = [];
  private listeners: ((toasts: ToastItem[]) => void)[] = [];

  subscribe(listener: (toasts: ToastItem[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  show(toast: Omit<AlertToastProps, 'onClose'>) {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastItem = {
      ...toast,
      id,
      onClose: () => this.remove(id),
    };

    this.toasts.push(newToast);
    this.notify();

    return id;
  }

  remove(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notify();
  }

  clear() {
    this.toasts = [];
    this.notify();
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export const toastManager = new ToastManager();

// Toast 容器组件
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return toastManager.subscribe(setToasts);
  }, []);

  return (
    <>
      {toasts.map(toast => (
        <AlertToast key={toast.id} {...toast} />
      ))}
    </>
  );
}

// 便捷方法
// eslint-disable-next-line react-refresh/only-export-components
export const toast = {
  info: (title: string, description: string) =>
    toastManager.show({ title, description, type: 'info' }),
  success: (title: string, description: string) =>
    toastManager.show({ title, description, type: 'success' }),
  warning: (title: string, description: string) =>
    toastManager.show({ title, description, type: 'warning' }),
  error: (title: string, description: string) =>
    toastManager.show({ title, description, type: 'error' }),
};
