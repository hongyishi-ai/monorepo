'use client';

import { useEffect, useState } from 'react';

function formatToday() {
  const now = new Date();
  const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()];

  return `${now.getMonth() + 1}月${now.getDate()}日 · ${weekday}`;
}

export function MobileTopBar() {
  const [today, setToday] = useState('');
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setToday(formatToday());
    setIsOnline(window.navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b-2 border-black bg-[#f4ecdc]/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur dark:border-white/20 dark:bg-black/90">
      <div className="flex items-center justify-between gap-4">
        <a href="/" className="flex min-h-11 items-center gap-2" aria-label="红医师主页">
          <span className="h-3 w-3 bg-constructivism-red" aria-hidden="true" />
          <span className="text-xl font-black leading-none text-constructivism-red">
            红医师
          </span>
        </a>

        <div className="text-right font-mono text-[0.68rem] leading-5 text-neutral-600 dark:text-neutral-400">
          <p>{today || '本地可用'}</p>
          <p className="font-bold text-[#12313c] dark:text-white">
            {isOnline ? '本地可用' : '离线可用'}
          </p>
        </div>
      </div>
    </header>
  );
}
