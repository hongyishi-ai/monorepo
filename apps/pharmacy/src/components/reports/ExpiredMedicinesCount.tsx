/**
 * 已过期药品数量组件
 * 用于在仪表板上显示已过期药品的数量
 */

import { useInventoryStats } from '@/hooks/use-inventory';

export function ExpiredMedicinesCount() {
  const { data: stats, isLoading, error } = useInventoryStats();

  if (isLoading) {
    return <span className='text-gray-400'>加载中...</span>;
  }

  if (error) {
    return <span className='text-red-400'>加载失败</span>;
  }

  return <>{stats?.expiredCount || 0}</>;
}
