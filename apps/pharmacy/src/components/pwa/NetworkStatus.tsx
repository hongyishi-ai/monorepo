import { Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

/**
 * 网络状态显示组件
 */
export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 自动隐藏离线提示
  useEffect(() => {
    if (showOfflineAlert) {
      const timer = setTimeout(() => {
        setShowOfflineAlert(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showOfflineAlert]);

  return (
    <>
      {/* 网络状态指示器 */}
      <div className='fixed top-4 left-4 z-50'>
        <Badge
          variant={isOnline ? 'default' : 'destructive'}
          className='flex items-center gap-1'
        >
          {isOnline ? (
            <>
              <Wifi className='h-3 w-3' />
              在线
            </>
          ) : (
            <>
              <WifiOff className='h-3 w-3' />
              离线
            </>
          )}
        </Badge>
      </div>

      {/* 离线提示 */}
      {showOfflineAlert && (
        <div className='fixed top-16 left-4 right-4 z-50'>
          <Alert variant='destructive'>
            <WifiOff className='h-4 w-4' />
            <AlertDescription>
              网络连接已断开，部分功能可能无法使用。系统将在网络恢复后自动同步数据。
            </AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
}
