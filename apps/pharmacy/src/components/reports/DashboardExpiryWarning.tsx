/**
 * 仪表板近效期提醒组件
 * 用于在仪表板上显示近效期药品提醒
 */

import { Link } from 'react-router-dom';

import { useExpiryWarnings } from '@/hooks/use-expiry-warnings';

export function DashboardExpiryWarning() {
  const { stats, isLoading } = useExpiryWarnings();

  if (isLoading) {
    return (
      <div className='flex items-start space-x-3'>
        <div className='w-2 h-2 bg-gray-300 rounded-full mt-2'></div>
        <div className='flex-1'>
          <p className='text-sm font-medium'>加载中...</p>
          <p className='text-xs text-gray-600'>正在获取近效期药品信息</p>
        </div>
      </div>
    );
  }

  if (stats.total === 0) {
    return (
      <div className='flex items-start space-x-3'>
        <div className='w-2 h-2 bg-green-500 rounded-full mt-2'></div>
        <div className='flex-1'>
          <p className='text-sm font-medium'>药品效期正常</p>
          <p className='text-xs text-gray-600'>目前没有近效期药品需要处理</p>
        </div>
      </div>
    );
  }

  // 确定提醒颜色和紧急程度
  let color = 'bg-orange-500';
  let urgencyText = '请注意';

  if (stats.expired > 0) {
    color = 'bg-red-500';
    urgencyText = '紧急处理';
  } else if (stats.critical > 0) {
    color = 'bg-red-500';
    urgencyText = '尽快处理';
  }

  return (
    <div className='flex items-start space-x-3'>
      <div className={`w-2 h-2 ${color} rounded-full mt-2`}></div>
      <div className='flex-1'>
        <p className='text-sm font-medium'>近效期提醒</p>
        <p className='text-xs text-gray-600'>
          有 {stats.total} 种药品即将过期，{urgencyText}
          {stats.expired > 0 && (
            <span className='text-red-500 font-medium'>
              {' '}
              (含 {stats.expired} 种已过期)
            </span>
          )}
        </p>
        <Link
          to='/reports?tab=expiry'
          className='text-xs text-blue-600 hover:underline mt-1 inline-block'
        >
          查看详情
        </Link>
      </div>
    </div>
  );
}
