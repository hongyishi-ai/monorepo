import { AlertTriangle, Box, Package2, RotateCcw } from 'lucide-react';
import { useState } from 'react';

import { InventoryList } from '@/components/inventory/InventoryList';
import { ReversibleTransactionsList } from '@/components/inventory/ReversibleTransactionsList';
import { StatsCard } from '@/components/ui/StatsCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInventoryStats } from '@/hooks/use-inventory';

/**
 * 库存查询页面
 * 提供库存查询、搜索和筛选功能，以及撤回出库操作功能
 */
export function InventoryPage() {
  const [activeTab, setActiveTab] = useState('inventory');

  return (
    <div className='min-h-screen bg-background'>
      <div className='w-full max-w-none px-2 sm:px-4 lg:px-6 py-4 sm:py-6'>
        <div className='mb-6'>
          <h1 className='text-3xl font-bold text-foreground'>库存管理</h1>
          <p className='text-muted-foreground mt-2'>
            查看药品库存情况，支持搜索和筛选功能，以及撤回出库操作
          </p>
        </div>

        {/* 概览卡片（与 Dashboard 口径一致） */}
        <InventoryOverview />

        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='inventory'>库存查询</TabsTrigger>
            <TabsTrigger value='reverse' className='flex items-center gap-2'>
              <RotateCcw className='h-4 w-4' />
              撤回操作
            </TabsTrigger>
          </TabsList>

          <TabsContent value='inventory' className='mt-6'>
            <InventoryList />
          </TabsContent>

          <TabsContent value='reverse' className='mt-6'>
            <ReversibleTransactionsList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default InventoryPage;

// 子组件：库存概览
function InventoryOverview() {
  const { data: stats } = useInventoryStats();
  return (
    <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6'>
      <StatsCard
        title='总药品种类'
        value={stats?.totalMedicines ?? 0}
        icon={<Package2 className='text-primary-600' />}
        subtitle='系统中已登记的药品'
      />
      <StatsCard
        title='正常库存种类'
        value={
          stats?.totalBatches
            ? Math.max(
                0,
                (stats.totalMedicines ?? 0) - (stats.lowStockCount ?? 0)
              )
            : 0
        }
        icon={<Box className='text-success' />}
        subtitle='不低于安全库存的药品'
      />
      <StatsCard
        title='库存不足种类'
        value={stats?.lowStockCount ?? 0}
        icon={<AlertTriangle className='text-destructive' />}
        subtitle='需要及时补货'
      />
      <StatsCard
        title='近效期批次'
        value={stats?.expiringCount ?? 0}
        icon={<AlertTriangle className='text-warning' />}
        subtitle='即将过期的批次数量'
      />
    </div>
  );
}
