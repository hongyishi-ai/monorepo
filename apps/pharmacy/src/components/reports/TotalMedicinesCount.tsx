/**
 * 总药品数量组件
 * 用于在仪表板上显示总药品种类数量
 */

import { useInventoryStats } from '@/hooks/use-inventory';

export function TotalMedicinesCount() {
  const { data: stats, isLoading } = useInventoryStats();

  if (isLoading) {
    return <span className='text-gray-400'>加载中...</span>;
  }

  return <>{stats?.totalMedicines || 0}</>;
}
