/**
 * 近效期药品数量组件
 * 用于在仪表板上显示近效期药品的数量
 */

import { useExpiryWarnings } from '@/hooks/use-expiry-warnings';

export function ExpiryWarningsCount() {
  const { stats, isLoading } = useExpiryWarnings();

  if (isLoading) {
    return <span className='text-gray-400'>—</span>;
  }

  return <>{stats.total || 0}</>;
}
