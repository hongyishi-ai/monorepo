/**
 * 库存不足数量组件
 * 用于在仪表板上显示库存不足药品的数量
 */

import { useLowStock } from '@/hooks/use-low-stock';

export function LowStockCount() {
  const { stats, isLoading } = useLowStock();

  if (isLoading) {
    return <span className='text-gray-400'>加载中...</span>;
  }

  return <>{stats.total || 0}</>;
}
