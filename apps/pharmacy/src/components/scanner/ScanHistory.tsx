import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useScanStore } from '@/stores/scan.store';

interface ScanHistoryProps {
  maxItems?: number;
  className?: string;
}

/**
 * 扫码历史记录组件
 * 显示最近的扫码记录，并允许用户选择历史记录
 */
export function ScanHistory({
  maxItems = 5,
  className = '',
}: ScanHistoryProps) {
  const scanHistory = useScanStore(state => state.scanHistory);
  const selectFromHistory = useScanStore(state => state.selectFromHistory);
  const clearHistory = useScanStore(state => state.clearHistory);

  // 获取限制数量的历史记录
  const limitedHistory = scanHistory.slice(0, maxItems);

  // 如果没有历史记录，显示空状态
  if (limitedHistory.length === 0) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <CardTitle className='text-sm font-medium'>扫码历史</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-center text-gray-500 py-4'>暂无扫码记录</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${className} shadow-sm`}>
      <CardHeader className='pb-2 px-4 py-3 sm:px-6 sm:py-4'>
        <div className='flex justify-between items-center'>
          <CardTitle className='text-sm font-medium'>扫码历史</CardTitle>
          <Button
            variant='ghost'
            size='sm'
            onClick={clearHistory}
            className='h-7 text-xs'
          >
            清空
          </Button>
        </div>
      </CardHeader>
      <CardContent className='px-4 sm:px-6 py-2'>
        <ul className='space-y-2'>
          {limitedHistory.map(item => (
            <li
              key={item.id}
              className='flex justify-between items-center p-2 rounded hover:bg-gray-100 cursor-pointer transition-colors'
              onClick={() => selectFromHistory(item)}
            >
              <div className='flex-1 min-w-0 mr-2'>
                <p className='font-medium truncate text-sm'>{item.barcode}</p>
                <p className='text-2xs sm:text-xs text-gray-500'>
                  {formatDistanceToNow(new Date(item.timestamp), {
                    addSuffix: true,
                    locale: zhCN,
                  })}
                  {item.type !== 'unknown' && (
                    <span className='ml-2'>
                      {item.type === 'medicine' ? '药品' : '批次'}
                    </span>
                  )}
                </p>
              </div>
              <Button
                variant='ghost'
                size='sm'
                className='h-7 text-xs px-2 sm:px-3'
                onClick={e => {
                  e.stopPropagation();
                  selectFromHistory(item);
                }}
              >
                使用
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
