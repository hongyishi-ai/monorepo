/**
 * 关键指标组件
 * 用于在仪表板上显示关键业务指标
 */

import {
  Activity,
  BarChart3,
  Minus,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useConsumptionSummary } from '@/hooks/use-consumption-stats';
import { cn } from '@/lib/utils';

export function KeyMetrics() {
  // 获取最近30天的消耗统计
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const { data: summary, isLoading } = useConsumptionSummary({
    startDate: startDate.toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>关键指标</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className='flex items-center p-4 bg-muted/30 rounded-lg animate-pulse'
              >
                <div className='w-10 h-10 rounded-full bg-muted'></div>
                <div className='ml-4 space-y-2'>
                  <div className='h-4 w-24 bg-muted rounded'></div>
                  <div className='h-6 w-16 bg-muted rounded'></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>关键指标</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center py-6 text-muted-foreground'>
            无法加载指标数据
          </div>
        </CardContent>
      </Card>
    );
  }

  // 获取趋势图标
  const getTrendIcon = (changeType: 'increase' | 'decrease' | 'stable') => {
    switch (changeType) {
      case 'increase':
        return <TrendingUp className='h-4 w-4 text-red-500' />;
      case 'decrease':
        return <TrendingDown className='h-4 w-4 text-green-500' />;
      default:
        return <Minus className='h-4 w-4 text-gray-500' />;
    }
  };

  // 获取趋势颜色
  const getTrendColor = (changeType: 'increase' | 'decrease' | 'stable') => {
    switch (changeType) {
      case 'increase':
        return 'text-red-600';
      case 'decrease':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const metrics = [
    {
      title: '30天消耗总量',
      value: `${summary.totalConsumption} 件`,
      icon: <BarChart3 className='h-8 w-8 text-blue-500' />,
      trend: summary.periodComparison.changeType,
      trendValue: summary.periodComparison.changePercentage.toFixed(1) + '%',
    },
    {
      title: '日均消耗量',
      value: `${Math.round(summary.averageDaily)} 件`,
      icon: <Activity className='h-8 w-8 text-purple-500' />,
    },
    {
      title: '消耗药品种类',
      value: `${summary.totalMedicines} 种`,
      icon: <BarChart3 className='h-8 w-8 text-green-500' />,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg flex items-center gap-2'>
          <Activity className='h-5 w-5' />
          关键指标 (近30天)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {metrics.map(metric => (
            <div
              key={metric.title}
              className='flex items-center p-4 bg-muted/30 rounded-lg'
            >
              <div className='flex-shrink-0'>{metric.icon}</div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-muted-foreground'>
                  {metric.title}
                </p>
                <div className='flex items-center gap-2'>
                  <p className='text-2xl font-bold'>{metric.value}</p>
                  {metric.trend && (
                    <div className='flex items-center'>
                      {getTrendIcon(metric.trend)}
                      <span
                        className={cn(
                          'text-xs ml-1',
                          getTrendColor(metric.trend)
                        )}
                      >
                        {metric.trendValue}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
