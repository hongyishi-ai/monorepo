import { BarChart3, LineChart, PieChart } from 'lucide-react';
import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  LineChart as RechartsLineChart,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type ConsumptionTrend } from '@/hooks/use-consumption-stats';

interface ConsumptionChartProps {
  data: ConsumptionTrend[];
  isLoading?: boolean;
}

type ChartType = 'line' | 'bar' | 'pie';

interface ChartDataPoint {
  name: string;
  [key: string]: string | number;
}

interface PieChartLabelProps {
  name: string;
  percent?: number;
  value?: number;
}

/**
 * 消耗图表组件
 * 使用 recharts 库展示消耗趋势图表
 */
export const ConsumptionChart = React.memo<ConsumptionChartProps>(
  ({ data, isLoading = false }) => {
    const [chartType, setChartType] = React.useState<ChartType>('bar');
    const [selectedMedicine, setSelectedMedicine] = React.useState<string>('');

    // 格式化周期标签
    const formatPeriodLabel = React.useCallback((period: string): string => {
      // 如果是日期格式 (YYYY-MM-DD)
      if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
        return period.substring(5); // 只显示 MM-DD
      }
      // 如果是月份格式 (YYYY-MM)
      if (/^\d{4}-\d{2}$/.test(period)) {
        return period.substring(5); // 只显示 MM
      }
      return period;
    }, []);

    // 获取图表颜色
    const chartColors = React.useMemo(
      () => [
        '#2563eb',
        '#10b981',
        '#f59e0b',
        '#ef4444',
        '#8b5cf6',
        '#06b6d4',
        '#ec4899',
        '#14b8a6',
        '#f97316',
        '#6366f1',
      ],
      []
    );

    // 处理图表数据
    const chartData = React.useMemo((): ChartDataPoint[] => {
      try {
        if (!data || data.length === 0) return [];

        // 如果选择了特定药品，只显示该药品的数据
        if (selectedMedicine && selectedMedicine !== 'all') {
          const medicine = data.find(
            item => item.medicineId === selectedMedicine
          );
          if (medicine) {
            return medicine.periods.map(period => ({
              name: formatPeriodLabel(period.period),
              消耗量: period.consumption,
            }));
          }
          return [];
        }

        // 否则，显示前5种药品的消耗趋势
        const topMedicines = data.slice(0, 5);

        // 获取所有唯一的周期
        const allPeriods = new Set<string>();
        topMedicines.forEach(medicine => {
          medicine.periods.forEach(period => {
            allPeriods.add(period.period);
          });
        });

        // 按周期排序
        const sortedPeriods = Array.from(allPeriods).sort();

        // 为每个周期创建数据点
        return sortedPeriods.map(period => {
          const dataPoint: ChartDataPoint = { name: formatPeriodLabel(period) };

          // 添加每种药品在该周期的消耗量
          topMedicines.forEach(medicine => {
            const periodData = medicine.periods.find(p => p.period === period);
            dataPoint[medicine.medicineName] = periodData
              ? periodData.consumption
              : 0;
          });

          return dataPoint;
        });
      } catch (error) {
        console.error('Error processing chart data:', error);
        return [];
      }
    }, [data, selectedMedicine, formatPeriodLabel]);

    // 药品选择器
    const medicineSelector = React.useMemo(
      () => (
        <div className='mb-4'>
          <Select value={selectedMedicine} onValueChange={setSelectedMedicine}>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='选择药品（显示前5种药品的趋势）' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>全部（前5种药品）</SelectItem>
              {data.slice(0, 10).map(medicine => (
                <SelectItem
                  key={medicine.medicineId}
                  value={medicine.medicineId}
                >
                  {medicine.medicineName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ),
      [data, selectedMedicine]
    );

    // 渲染图表
    const renderChart = React.useCallback(() => {
      if (isLoading) {
        return (
          <div className='h-80 flex items-center justify-center'>
            <div className='animate-pulse text-center'>
              <div className='h-4 w-32 rounded bg-muted mx-auto'></div>
              <p className='mt-2 text-sm text-muted-foreground'>
                加载图表数据中...
              </p>
            </div>
          </div>
        );
      }

      if (chartData.length === 0) {
        return (
          <div className='h-80 flex items-center justify-center'>
            <div className='text-center'>
              <BarChart3 className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
              <p className='text-muted-foreground'>没有可显示的图表数据</p>
            </div>
          </div>
        );
      }

      switch (chartType) {
        case 'bar':
          return (
            <ResponsiveContainer width='100%' height={400}>
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis
                  dataKey='name'
                  angle={-45}
                  textAnchor='end'
                  height={60}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => [`${value} 件`, '消耗量']}
                />
                <Legend />
                {selectedMedicine ? (
                  <Bar dataKey='消耗量' fill={chartColors[0]} />
                ) : (
                  data
                    .slice(0, 5)
                    .map((medicine, index) => (
                      <Bar
                        key={medicine.medicineId}
                        dataKey={medicine.medicineName}
                        fill={chartColors[index % chartColors.length]}
                      />
                    ))
                )}
              </BarChart>
            </ResponsiveContainer>
          );

        case 'line':
          return (
            <ResponsiveContainer width='100%' height={400}>
              <RechartsLineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis
                  dataKey='name'
                  angle={-45}
                  textAnchor='end'
                  height={60}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => [`${value} 件`, '消耗量']}
                />
                <Legend />
                {selectedMedicine ? (
                  <Line
                    type='monotone'
                    dataKey='消耗量'
                    stroke={chartColors[0]}
                    activeDot={{ r: 8 }}
                  />
                ) : (
                  data
                    .slice(0, 5)
                    .map((medicine, index) => (
                      <Line
                        key={medicine.medicineId}
                        type='monotone'
                        dataKey={medicine.medicineName}
                        stroke={chartColors[index % chartColors.length]}
                        activeDot={{ r: 6 }}
                      />
                    ))
                )}
              </RechartsLineChart>
            </ResponsiveContainer>
          );

        case 'pie': {
          // 饼图显示总消耗量
          const pieData = selectedMedicine
            ? chartData
                .map(item => ({
                  name: item.name,
                  value: typeof item.消耗量 === 'number' ? item.消耗量 : 0,
                }))
                .filter(item => item.value > 0) // 过滤掉零值
            : data
                .slice(0, 10)
                .map(medicine => ({
                  name: medicine.medicineName,
                  value: medicine.totalConsumption || 0,
                }))
                .filter(item => item.value > 0); // 过滤掉零值

          return (
            <ResponsiveContainer width='100%' height={400}>
              <RechartsPieChart
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                {pieData.length > 0 ? (
                  <Pie
                    data={pieData}
                    cx='50%'
                    cy='50%'
                    labelLine={true}
                    outerRadius={150}
                    fill='#8884d8'
                    dataKey='value'
                    label={(props: PieChartLabelProps) => {
                      const { name, percent } = props;
                      if (typeof percent === 'number' && !isNaN(percent)) {
                        return `${name}: ${(percent * 100).toFixed(1)}%`;
                      }
                      return name; // 至少显示名称
                    }}
                  >
                    {pieData.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={chartColors[index % chartColors.length]}
                      />
                    ))}
                  </Pie>
                ) : null}
                <Tooltip
                  formatter={(value: number) => [`${value} 件`, '消耗量']}
                />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          );
        }

        default:
          return null;
      }
    }, [chartType, chartData, isLoading, selectedMedicine, data, chartColors]);

    return (
      <Card>
        <CardHeader>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <CardTitle className='flex items-center gap-2'>
              {chartType === 'bar' && <BarChart3 className='h-5 w-5' />}
              {chartType === 'line' && <LineChart className='h-5 w-5' />}
              {chartType === 'pie' && <PieChart className='h-5 w-5' />}
              消耗趋势图表
            </CardTitle>
            <Select
              value={chartType}
              onValueChange={(value: ChartType) => setChartType(value)}
            >
              <SelectTrigger className='w-32'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='bar'>柱状图</SelectItem>
                <SelectItem value='line'>折线图</SelectItem>
                <SelectItem value='pie'>饼图</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {medicineSelector}
          {renderChart()}
        </CardContent>
      </Card>
    );
  }
);

ConsumptionChart.displayName = 'ConsumptionChart';
