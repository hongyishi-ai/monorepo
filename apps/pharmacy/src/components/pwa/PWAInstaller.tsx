import { Download, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * PWA安装提示组件
 */
export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 检查是否已安装
    const checkInstalled = () => {
      const isStandalone = window.matchMedia(
        '(display-mode: standalone)'
      ).matches;
      const isInWebAppiOS =
        (window.navigator as Navigator & { standalone?: boolean })
          .standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    checkInstalled();

    // 监听安装提示事件
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // 延迟显示安装提示，避免过于突兀
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
    };

    // 监听安装完成事件
    const handleAppInstalled = () => {
      console.log('PWA已安装');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('PWA安装被接受');
      } else {
        console.log('PWA安装被拒绝');
      }
    } catch (error) {
      console.error('PWA安装过程中出错:', error);
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // 24小时后再次显示
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // 检查是否在24小时内被拒绝过
  const isDismissedRecently = () => {
    const dismissedTime = localStorage.getItem('pwa-install-dismissed');
    if (!dismissedTime) return false;

    const now = Date.now();
    const dismissed = parseInt(dismissedTime);
    const hoursPassed = (now - dismissed) / (1000 * 60 * 60);

    return hoursPassed < 24;
  };

  if (isInstalled || !showInstallPrompt || isDismissedRecently()) {
    return null;
  }

  return (
    <Card className='fixed bottom-4 right-4 w-80 z-50 shadow-lg border-primary/20 bg-white/95 backdrop-blur-sm'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg flex items-center gap-2'>
            <div className='w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md flex items-center justify-center'>
              <span className='text-white text-xs font-bold'>药</span>
            </div>
            安装应用
          </CardTitle>
          <Button variant='ghost' size='sm' onClick={handleDismiss}>
            <X className='h-4 w-4' />
          </Button>
        </div>
        <CardDescription>
          将药房管理系统安装到您的设备上，获得更好的使用体验：
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-3'>
        <ul className='text-sm text-muted-foreground space-y-1'>
          <li>• 快速启动，无需打开浏览器</li>
          <li>• 离线查看基本功能</li>
          <li>• 更流畅的操作体验</li>
        </ul>
        <Button onClick={handleInstallClick} className='w-full'>
          <Download className='h-4 w-4 mr-2' />
          安装到设备
        </Button>
      </CardContent>
    </Card>
  );
}
