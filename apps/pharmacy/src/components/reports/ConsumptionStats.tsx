import {
  Activity,
  BarChart3,
  Calendar,
  Download,
  Minus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Calendar as UiCalendar } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// import { toast } from '@/components/ui/alert-toast';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useConsumptionSummary,
  useConsumptionTrend,
  useDailyConsumption,
  type ConsumptionStatsParams,
} from '@/hooks/use-consumption-stats';
import { cn } from '@/lib/utils';
import { type CategorizedMedicine } from '@/services/daily-consumption-export.service';

/**
 * 消耗统计组件
 * 显示药品消耗统计信息，包括日消耗、趋势分析等
 */
export function ConsumptionStats() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0], // 30天前
    endDate: new Date().toISOString().split('T')[0], // 今天
  });
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [selectedMedicine, setSelectedMedicine] = useState<string>('');

  const queryParams: ConsumptionStatsParams = useMemo(
    () => ({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      groupBy,
      medicineId: selectedMedicine || undefined,
      limit: 1000,
    }),
    [dateRange, groupBy, selectedMedicine]
  );

  const {
    data: dailyConsumption,
    isLoading: isDailyLoading,
    refetch: refetchDaily,
  } = useDailyConsumption(queryParams);

  const { data: consumptionTrend, isLoading: isTrendLoading } =
    useConsumptionTrend(queryParams);

  const { data: consumptionSummary, isLoading: isSummaryLoading } =
    useConsumptionSummary(queryParams);

  const isLoading = isDailyLoading || isTrendLoading || isSummaryLoading;

  // 处理日期范围变更
  const handleDateRangeChange = (
    field: 'startDate' | 'endDate',
    value: string
  ) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  // 生成报表数据
  const generateReportData = () => {
    if (!dailyConsumption || dailyConsumption.length === 0) {
      return null;
    }

    // 转换数据格式并使用数据库中的分类信息
    const consumptionData = dailyConsumption.map(item => ({
      medicineId: item.medicineId,
      medicineName: item.medicineName,
      barcode: item.barcode,
      totalOutbound: item.totalOutbound,
      batchCount: item.batchCount,
      specification: item.specification,
      manufacturer: item.manufacturer,
      category: item.category || 'internal', // 使用数据库中的分类，默认为内服
    }));

    const getCategoryName = (category: string) => {
      const categoryNames = {
        internal: '内服',
        external: '外用',
        injection: '针剂',
      };
      return categoryNames[category as keyof typeof categoryNames];
    };

    // 分类消耗数据
    const categorized = {
      internal: [] as CategorizedMedicine[],
      external: [] as CategorizedMedicine[],
      injection: [] as CategorizedMedicine[],
    };

    consumptionData.forEach(item => {
      const category = item.category;
      const categorizedItem = {
        category,
        categoryName: getCategoryName(category),
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        specification: item.specification,
        manufacturer: item.manufacturer,
        barcode: item.barcode,
        totalConsumption: item.totalOutbound,
        batchCount: item.batchCount,
      };
      categorized[category as keyof typeof categorized].push(categorizedItem);
    });

    const categories = categorized;

    const totals = {
      internal: categories.internal.reduce(
        (sum, item) => sum + item.totalConsumption,
        0
      ),
      external: categories.external.reduce(
        (sum, item) => sum + item.totalConsumption,
        0
      ),
      injection: categories.injection.reduce(
        (sum, item) => sum + item.totalConsumption,
        0
      ),
      overall: 0,
    };
    totals.overall = totals.internal + totals.external + totals.injection;

    return {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      reportNumber: `RPT${dateRange.startDate.replace(/-/g, '')}_${dateRange.endDate.replace(/-/g, '')}`,
      filledBy: '',
      categories,
      totals,
    };
  };

  // 导出为Excel格式
  const handleExportExcel = () => {
    const reportData = generateReportData();
    if (!reportData) {
      alert('没有数据可导出');
      return;
    }

    // 创建Excel导出逻辑
    import('@/services/daily-consumption-export.service').then(
      ({ dailyConsumptionExportService }) => {
        dailyConsumptionExportService.exportDateRangeToExcel(reportData);
      }
    );
  };

  // 导出为CSV格式
  const handleExportCSV = () => {
    const reportData = generateReportData();
    if (!reportData) {
      alert('没有数据可导出');
      return;
    }

    // 创建CSV导出逻辑
    import('@/services/daily-consumption-export.service').then(
      ({ dailyConsumptionExportService }) => {
        dailyConsumptionExportService.exportDateRangeToCSV(reportData);
      }
    );
  };

  // 导出为PDF格式
  const handleExportPDF = () => {
    const reportData = generateReportData();
    if (!reportData) {
      alert('没有数据可导出');
      return;
    }

    // 创建PDF导出逻辑
    import('@/services/daily-consumption-export.service').then(
      ({ dailyConsumptionExportService }) => {
        dailyConsumptionExportService.exportToPDF();
      }
    );
  };

  // 获取趋势图标
  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className='h-4 w-4 text-red-500' />;
      case 'decreasing':
        return <TrendingDown className='h-4 w-4 text-green-500' />;
      default:
        return <Minus className='h-4 w-4 text-gray-500' />;
    }
  };

  // 获取趋势颜色
  const getTrendColor = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing':
        return 'text-red-600';
      case 'decreasing':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  return (
    <div className='space-y-6'>
      {/* 控制面板 */}
      <Card>
        <CardHeader>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <CardTitle className='flex items-center gap-2'>
              <BarChart3 className='h-5 w-5' />
              消耗统计
            </CardTitle>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => refetchDaily()}
                loading={isLoading}
                className='flex items-center gap-2'
              >
                <RefreshCw
                  className={cn('h-4 w-4', isLoading && 'animate-spin')}
                />
                刷新
              </Button>
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='outline'
                      size='sm'
                      disabled={isLoading || !dailyConsumption?.length}
                      className='flex items-center gap-2'
                    >
                      <Download className='h-4 w-4' /> 导出
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem onClick={handleExportExcel}>
                      导出 Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportCSV}>
                      导出 CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportPDF}>
                      导出 PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div>
              <label className='text-sm font-medium mb-2 block'>开始日期</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant='outline' className='w-full justify-start'>
                    {dateRange.startDate || '选择日期'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <UiCalendar
                    value={dateRange.startDate}
                    onChange={value =>
                      handleDateRangeChange('startDate', value)
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className='text-sm font-medium mb-2 block'>结束日期</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant='outline' className='w-full justify-start'>
                    {dateRange.endDate || '选择日期'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <UiCalendar
                    value={dateRange.endDate}
                    onChange={value => handleDateRangeChange('endDate', value)}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className='text-sm font-medium mb-2 block'>统计周期</label>
              <Select
                value={groupBy}
                onValueChange={(value: 'day' | 'week' | 'month') =>
                  setGroupBy(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='day'>按天</SelectItem>
                  <SelectItem value='week'>按周</SelectItem>
                  <SelectItem value='month'>按月</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className='text-sm font-medium mb-2 block'>药品筛选</label>
              <Input
                placeholder='药品ID (可选)'
                value={selectedMedicine}
                onChange={e => setSelectedMedicine(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 汇总统计 */}
      {consumptionSummary && (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    药品种类
                  </p>
                  <p className='text-2xl font-bold'>
                    {consumptionSummary.totalMedicines} 种
                  </p>
                </div>
                <Activity className='h-8 w-8 text-blue-500' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    总消耗量
                  </p>
                  <p className='text-2xl font-bold'>
                    {consumptionSummary.totalConsumption} 件
                  </p>
                </div>
                <BarChart3 className='h-8 w-8 text-green-500' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    日均消耗
                  </p>
                  <p className='text-2xl font-bold'>
                    {Math.round(consumptionSummary.averageDaily)}
                  </p>
                </div>
                <Calendar className='h-8 w-8 text-orange-500' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    周期对比
                  </p>
                  <div className='flex items-center gap-2'>
                    <p className='text-2xl font-bold'>
                      {consumptionSummary.periodComparison.changePercentage.toFixed(
                        1
                      )}
                      %
                    </p>
                    {consumptionSummary.periodComparison.changeType ===
                      'increase' && (
                      <TrendingUp className='h-4 w-4 text-red-500' />
                    )}
                    {consumptionSummary.periodComparison.changeType ===
                      'decrease' && (
                      <TrendingDown className='h-4 w-4 text-green-500' />
                    )}
                    {consumptionSummary.periodComparison.changeType ===
                      'stable' && <Minus className='h-4 w-4 text-gray-500' />}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 消耗趋势 */}
      {consumptionTrend && consumptionTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>消耗趋势分析</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 桌面端表格视图 */}
            <div className='hidden md:block overflow-x-auto'>
              <table className='w-full border-collapse'>
                <thead>
                  <tr className='border-b'>
                    <th className='px-4 py-3 text-left'>药品名称</th>
                    <th className='px-4 py-3 text-left'>条码</th>
                    <th className='px-4 py-3 text-center'>总消耗</th>
                    <th className='px-4 py-3 text-center'>日均消耗</th>
                    <th className='px-4 py-3 text-center'>趋势</th>
                    <th className='px-4 py-3 text-center'>变化幅度</th>
                  </tr>
                </thead>
                <tbody>
                  {consumptionTrend.slice(0, 20).map(item => (
                    <tr
                      key={item.medicineId}
                      className='border-b hover:bg-muted/50'
                    >
                      <td className='px-4 py-3 font-medium'>
                        {item.medicineName}
                      </td>
                      <td className='px-4 py-3 font-mono text-sm'>
                        {item.barcode}
                      </td>
                      <td className='px-4 py-3 text-center font-semibold'>
                        {item.totalConsumption} 件
                      </td>
                      <td className='px-4 py-3 text-center'>
                        {Math.round(item.averageDaily)} 件
                      </td>
                      <td className='px-4 py-3 text-center'>
                        <div className='flex items-center justify-center gap-2'>
                          {getTrendIcon(item.trend)}
                          <span
                            className={cn('text-sm', getTrendColor(item.trend))}
                          >
                            {item.trend === 'increasing' && '上升'}
                            {item.trend === 'decreasing' && '下降'}
                            {item.trend === 'stable' && '稳定'}
                          </span>
                        </div>
                      </td>
                      <td className='px-4 py-3 text-center'>
                        <span className={getTrendColor(item.trend)}>
                          {item.trendPercentage.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 移动端卡片视图 */}
            <div className='md:hidden space-y-3'>
              {consumptionTrend.slice(0, 20).map(item => (
                <Card key={item.medicineId} className='w-full'>
                  <CardContent className='p-3'>
                    <div className='flex justify-between items-start mb-3'>
                      <div className='flex-1 min-w-0'>
                        <h3 className='font-semibold text-base text-gray-900 truncate'>
                          {item.medicineName}
                        </h3>
                        <p className='text-sm text-gray-600 mt-1 font-mono'>
                          {item.barcode}
                        </p>
                      </div>
                      <div className='ml-2 flex items-center gap-2'>
                        {getTrendIcon(item.trend)}
                        <span
                          className={cn(
                            'text-sm font-medium',
                            getTrendColor(item.trend)
                          )}
                        >
                          {item.trend === 'increasing' && '上升'}
                          {item.trend === 'decreasing' && '下降'}
                          {item.trend === 'stable' && '稳定'}
                        </span>
                      </div>
                    </div>

                    <div className='grid grid-cols-2 gap-2 text-sm'>
                      <div>
                        <span className='text-gray-500'>总消耗:</span>
                        <span className='ml-1 font-semibold text-gray-900'>
                          {item.totalConsumption} 件
                        </span>
                      </div>
                      <div>
                        <span className='text-gray-500'>日均消耗:</span>
                        <span className='ml-1 text-gray-900'>
                          {Math.round(item.averageDaily)} 件
                        </span>
                      </div>
                      <div className='col-span-2'>
                        <span className='text-gray-500'>变化幅度:</span>
                        <span
                          className={cn(
                            'ml-1 font-medium',
                            getTrendColor(item.trend)
                          )}
                        >
                          {item.trendPercentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 消耗排行榜 */}
      {consumptionSummary?.topConsumers &&
        consumptionSummary.topConsumers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>消耗排行榜</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {consumptionSummary.topConsumers.map((item, index) => (
                  <div
                    key={item.medicineId}
                    className='flex items-center justify-between p-4 bg-muted/30 rounded-lg'
                  >
                    <div className='flex items-center gap-4'>
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                          index < 3
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-600'
                        )}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className='font-medium'>{item.medicineName}</p>
                        <p className='text-sm text-muted-foreground font-mono'>
                          {item.barcode}
                        </p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p className='font-semibold'>{item.consumption} 件</p>
                      <p className='text-sm text-muted-foreground'>
                        {item.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* 日消耗详情 */}
      {dailyConsumption && dailyConsumption.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>消耗详情</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 桌面端表格视图 */}
            <div className='hidden md:block overflow-x-auto'>
              <table className='w-full border-collapse'>
                <thead>
                  <tr className='border-b'>
                    <th className='px-4 py-3 text-left'>日期</th>
                    <th className='px-4 py-3 text-left'>药品名称</th>
                    <th className='px-4 py-3 text-left'>条码</th>
                    <th className='px-4 py-3 text-center'>消耗数量</th>
                    <th className='px-4 py-3 text-center'>批次数</th>
                    <th className='px-4 py-3 text-left'>规格</th>
                    <th className='px-4 py-3 text-left'>生产厂家</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyConsumption.slice(0, 100).map((item, index) => (
                    <tr
                      key={`${item.date}-${item.medicineId}-${index}`}
                      className='border-b hover:bg-muted/50'
                    >
                      <td className='px-4 py-3'>{formatDate(item.date)}</td>
                      <td className='px-4 py-3 font-medium'>
                        {item.medicineName}
                      </td>
                      <td className='px-4 py-3 font-mono text-sm'>
                        {item.barcode}
                      </td>
                      <td className='px-4 py-3 text-center font-semibold'>
                        {item.totalOutbound} 件
                      </td>
                      <td className='px-4 py-3 text-center'>
                        {item.batchCount}
                      </td>
                      <td className='px-4 py-3 text-sm'>
                        {item.specification || '-'}
                      </td>
                      <td className='px-4 py-3 text-sm'>
                        {item.manufacturer || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 移动端卡片视图 */}
            <div className='md:hidden space-y-3'>
              {dailyConsumption.slice(0, 100).map((item, index) => (
                <Card
                  key={`${item.date}-${item.medicineId}-${index}`}
                  className='w-full'
                >
                  <CardContent className='p-3'>
                    <div className='flex justify-between items-start mb-3'>
                      <div className='flex-1 min-w-0'>
                        <h3 className='font-semibold text-base text-gray-900 truncate'>
                          {item.medicineName}
                        </h3>
                        <p className='text-sm text-gray-600 mt-1 font-mono'>
                          {item.barcode}
                        </p>
                      </div>
                      <div className='ml-2 text-right'>
                        <div className='text-sm text-gray-500'>
                          {formatDate(item.date)}
                        </div>
                        <div className='text-lg font-semibold text-gray-900'>
                          {item.totalOutbound} 件
                        </div>
                      </div>
                    </div>

                    <div className='grid grid-cols-2 gap-2 text-sm'>
                      <div>
                        <span className='text-gray-500'>批次数:</span>
                        <span className='ml-1 text-gray-900'>
                          {item.batchCount}
                        </span>
                      </div>
                      <div>
                        <span className='text-gray-500'>规格:</span>
                        <span className='ml-1 text-gray-900'>
                          {item.specification || '-'}
                        </span>
                      </div>
                      <div className='col-span-2'>
                        <span className='text-gray-500'>生产厂家:</span>
                        <span className='ml-1 text-gray-900'>
                          {item.manufacturer || '-'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {dailyConsumption.length > 100 && (
              <div className='mt-4 text-center text-sm text-muted-foreground'>
                显示前 100 条记录，共 {dailyConsumption.length} 条
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <Card>
          <CardContent className='p-8'>
            <div className='flex justify-center items-center'>
              <RefreshCw className='h-6 w-6 animate-spin mr-2' />
              <span>加载统计数据中...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 无数据状态 */}
      {!isLoading && (!dailyConsumption || dailyConsumption.length === 0) && (
        <Card>
          <CardContent className='p-8'>
            <div className='text-center'>
              <BarChart3 className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
              <p className='text-muted-foreground'>所选时间段内没有消耗数据</p>
              <p className='text-sm text-muted-foreground mt-2'>
                请调整日期范围或检查是否有出库记录
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
