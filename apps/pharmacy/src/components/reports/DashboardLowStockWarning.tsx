/**
 * 仪表板库存不足提醒组件
 * 用于在仪表板上显示库存不足药品提醒
 */

import { Link } from 'react-router-dom';

import { useLowStock } from '@/hooks/use-low-stock';

export function DashboardLowStockWarning() {
  const { stats, isLoading } = useLowStock();

  if (isLoading) {
    return (
      <div className='flex items-start space-x-3'>
        <div className='w-2 h-2 bg-gray-300 rounded-full mt-2'></div>
        <div className='flex-1'>
          <p className='text-sm font-medium'>加载中...</p>
          <p className='text-xs text-gray-600'>正在获取库存不足药品信息</p>
        </div>
      </div>
    );
  }

  if (stats.total === 0) {
    return (
      <div className='flex items-start space-x-3'>
        <div className='w-2 h-2 bg-green-500 rounded-full mt-2'></div>
        <div className='flex-1'>
          <p className='text-sm font-medium'>库存状态正常</p>
          <p className='text-xs text-gray-600'>目前没有库存不足药品需要处理</p>
        </div>
      </div>
    );
  }

  // 确定提醒颜色和紧急程度
  let color = 'bg-orange-500';
  let urgencyText = '请注意';

  if (stats.outOfStock > 0) {
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
        <p className='text-sm font-medium'>库存不足</p>
        <p className='text-xs text-gray-600'>
          有 {stats.total} 种药品库存不足，{urgencyText}
          {stats.outOfStock > 0 && (
            <span className='text-red-500 font-medium'>
              {' '}
              (含 {stats.outOfStock} 种缺货)
            </span>
          )}
        </p>
        <Link
          to='/reports?tab=lowstock'
          className='text-xs text-blue-600 hover:underline mt-1 inline-block'
        >
          查看详情
        </Link>
      </div>
    </div>
  );
}
