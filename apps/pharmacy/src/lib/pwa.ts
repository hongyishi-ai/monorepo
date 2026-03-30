/**
 * PWA相关工具函数
 */

/**
 * 注册Service Worker
 */
export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        console.log('Service Worker注册成功:', registration);

        // 监听更新
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // 有新版本可用
                console.log('新版本可用');
                if (confirm('发现新版本，是否立即更新？')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          }
        });

        // 监听控制器变化
        let hasRefreshed = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (hasRefreshed) return;
          hasRefreshed = true;
          console.log('Service Worker控制器已更新');
          window.location.reload();
        });
      } catch (error) {
        console.error('Service Worker注册失败:', error);
      }
    });
  } else {
    console.log('当前浏览器不支持Service Worker');
  }
}

/**
 * 开发环境：注销已注册的 Service Worker，避免干扰 Vite HMR
 */
export async function unregisterServiceWorkersForDev(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r => r.unregister()));
    // 清理可能的 PWA 缓存，避免加载旧资源
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      } catch {
        // 忽略缓存清理失败
      }
    }
    console.log('已注销所有 Service Worker（开发环境）');
  } catch (e) {
    console.warn('注销 Service Worker 失败（开发环境）:', e);
  }
}

/**
 * 检查PWA支持
 */
export function isPWASupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * 检查是否在PWA模式下运行
 */
export function isPWAMode(): boolean {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isInWebAppiOS =
    (window.navigator as ExtendedNavigator).standalone === true;
  return isStandalone || isInWebAppiOS;
}

/**
 * 检查是否支持安装PWA
 */
export function canInstallPWA(): boolean {
  return 'beforeinstallprompt' in window;
}

/**
 * 网络连接接口定义
 */
interface NetworkConnection {
  effectiveType?: string;
  downlink?: number;
}

/**
 * 扩展Navigator接口
 */
interface ExtendedNavigator extends Navigator {
  connection?: NetworkConnection;
  mozConnection?: NetworkConnection;
  webkitConnection?: NetworkConnection;
  standalone?: boolean;
}

/**
 * 获取网络状态
 */
export function getNetworkStatus(): {
  online: boolean;
  effectiveType?: string;
  downlink?: number;
} {
  const connection =
    (navigator as ExtendedNavigator).connection ||
    (navigator as ExtendedNavigator).mozConnection ||
    (navigator as ExtendedNavigator).webkitConnection;

  return {
    online: navigator.onLine,
    effectiveType: connection?.effectiveType,
    downlink: connection?.downlink,
  };
}

/**
 * 监听网络状态变化
 */
export function onNetworkStatusChange(
  callback: (online: boolean) => void
): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * 安装提示事件接口
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

/**
 * 显示安装提示
 */
export function showInstallPrompt(): Promise<boolean> {
  return new Promise(resolve => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const deferredPrompt = e as BeforeInstallPromptEvent;

      // 显示安装提示
      deferredPrompt.prompt();

      deferredPrompt.userChoice.then(choiceResult => {
        if (choiceResult.outcome === 'accepted') {
          console.log('用户接受了安装提示');
          resolve(true);
        } else {
          console.log('用户拒绝了安装提示');
          resolve(false);
        }
      });

      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  });
}
