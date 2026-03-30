import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Download,
  FileText,
  Package,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ExpiryWarnings } from '@/components/reports/ExpiryWarnings';
import {
  ConsumptionStats,
  InventoryTransactionsReport,
} from '@/components/reports/index';
import { LowStockWarnings } from '@/components/reports/LowStockWarnings';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * 报表页面
 * 提供各种统计报表功能
 */
export function ReportsPage() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>('stats');

  // 根据URL参数设置活动选项卡
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (
      tab &&
      ['stats', 'charts', 'transactions', 'expiry', 'lowstock'].includes(tab)
    ) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // 导出所有报表数据
  const handleExportAll = () => {
    // 这里可以实现导出所有报表数据的功能
    alert('导出所有报表数据功能将在后续版本实现');
  };

  return (
    <div className='min-h-screen bg-background'>
      <div className='container mx-auto px-4 py-6'>
        {/* 页面标题 */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8'>
          <div>
            <h1 className='text-3xl font-bold'>统计报表</h1>
            <p className='text-muted-foreground mt-2'>
              查看药品消耗统计、趋势分析和各类报表
            </p>
          </div>
          <Button
            variant='outline'
            className='flex items-center gap-2'
            onClick={handleExportAll}
          >
            <Download className='h-4 w-4' />
            导出所有报表
          </Button>
        </div>

        {/* 报表选项卡 */}
        <Tabs
          defaultValue='stats'
          value={activeTab}
          onValueChange={setActiveTab}
          className='space-y-6'
        >
          <TabsList className='grid w-full grid-cols-5'>
            <TabsTrigger value='stats' className='flex items-center gap-2'>
              <FileText className='h-4 w-4' />
              详细统计
            </TabsTrigger>
            <TabsTrigger value='charts' className='flex items-center gap-2'>
              <BarChart3 className='h-4 w-4' />
              图表分析
            </TabsTrigger>
            <TabsTrigger
              value='transactions'
              className='flex items-center gap-2'
            >
              <Package className='h-4 w-4' />
              出入库记录
            </TabsTrigger>
            <TabsTrigger value='expiry' className='flex items-center gap-2'>
              <AlertTriangle className='h-4 w-4' />
              近效期提醒
            </TabsTrigger>
            <TabsTrigger value='lowstock' className='flex items-center gap-2'>
              <AlertCircle className='h-4 w-4' />
              库存不足
            </TabsTrigger>
          </TabsList>

          <TabsContent value='stats'>
            <ConsumptionStats />
          </TabsContent>

          <TabsContent value='charts'>
            <div className='text-center py-16'>
              <BarChart3 className='h-16 w-16 text-muted-foreground mx-auto mb-4' />
              <h3 className='text-lg font-semibold mb-2'>图表分析</h3>
              <p className='text-muted-foreground'>图表分析功能正在开发中</p>
              <p className='text-sm text-muted-foreground mt-2'>
                敬请期待更丰富的数据可视化功能
              </p>
            </div>
          </TabsContent>

          <TabsContent value='transactions'>
            <div className='space-y-4'>
              <div>
                <h3 className='text-lg font-semibold mb-2'>出入库记录</h3>
                <p className='text-muted-foreground'>
                  查看详细的出入库记录，支持按日期、类型筛选和导出
                </p>
              </div>
              <InventoryTransactionsReport />
            </div>
          </TabsContent>

          <TabsContent value='expiry'>
            <div className='space-y-4'>
              <div>
                <h3 className='text-lg font-semibold mb-2'>近效期药品管理</h3>
                <p className='text-muted-foreground'>
                  查看所有即将过期的药品，并根据剩余有效期进行分类管理
                </p>
              </div>
              <ExpiryWarnings
                limit={50}
                showSettings={true}
                showViewAll={false}
              />
            </div>
          </TabsContent>

          <TabsContent value='lowstock'>
            <div className='space-y-4'>
              <div>
                <h3 className='text-lg font-semibold mb-2'>库存不足药品管理</h3>
                <p className='text-muted-foreground'>
                  查看所有库存不足的药品，并根据缺货程度进行分类管理
                </p>
              </div>
              <LowStockWarnings
                limit={50}
                showSettings={true}
                showViewAll={false}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default ReportsPage;
