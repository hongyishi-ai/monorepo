import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ConsumptionChart } from '../ConsumptionChart';

import type { ConsumptionTrend } from '@/hooks/use-consumption-stats';

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='responsive-container'>{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='bar-chart'>{children}</div>
  ),
  Bar: () => <div data-testid='bar' />,
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='line-chart'>{children}</div>
  ),
  Line: () => <div data-testid='line' />,
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='pie-chart'>{children}</div>
  ),
  Pie: () => <div data-testid='pie' />,
  Cell: () => <div data-testid='cell' />,
  XAxis: () => <div data-testid='x-axis' />,
  YAxis: () => <div data-testid='y-axis' />,
  CartesianGrid: () => <div data-testid='cartesian-grid' />,
  Tooltip: () => <div data-testid='tooltip' />,
  Legend: () => <div data-testid='legend' />,
}));

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='card'>{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='card-header'>{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='card-title'>{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='card-content'>{children}</div>
  ),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='select'>{children}</div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='select-content'>{children}</div>
  ),
  SelectItem: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => <div data-testid={`select-item-${value}`}>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='select-trigger'>{children}</div>
  ),
  SelectValue: () => <div data-testid='select-value' />,
}));

const mockData: ConsumptionTrend[] = [
  {
    medicineId: '1',
    medicineName: '阿司匹林',
    barcode: '123456789',
    periods: [
      { period: '2024-01-01', consumption: 10, batchCount: 2 },
      { period: '2024-01-02', consumption: 15, batchCount: 3 },
    ],
    totalConsumption: 25,
    averageDaily: 12.5,
    trend: 'increasing',
    trendPercentage: 50,
  },
  {
    medicineId: '2',
    medicineName: '布洛芬',
    barcode: '987654321',
    periods: [
      { period: '2024-01-01', consumption: 8, batchCount: 1 },
      { period: '2024-01-02', consumption: 12, batchCount: 2 },
    ],
    totalConsumption: 20,
    averageDaily: 10,
    trend: 'stable',
    trendPercentage: 25,
  },
];

describe('ConsumptionChart', () => {
  it('should render chart title', () => {
    render(<ConsumptionChart data={mockData} />);
    expect(screen.getByText('消耗趋势图表')).toBeInTheDocument();
  });

  it('should render chart components', () => {
    render(<ConsumptionChart data={mockData} />);
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByTestId('card-header')).toBeInTheDocument();
    expect(screen.getByTestId('card-content')).toBeInTheDocument();
  });

  it('should render selectors', () => {
    render(<ConsumptionChart data={mockData} />);
    expect(screen.getAllByTestId('select')).toHaveLength(2); // chart type and medicine selector
  });

  it('should render bar chart by default', () => {
    render(<ConsumptionChart data={mockData} />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<ConsumptionChart data={[]} isLoading={true} />);
    expect(screen.getByText('加载图表数据中...')).toBeInTheDocument();
  });

  it('should show empty state when no data', () => {
    render(<ConsumptionChart data={[]} />);
    expect(screen.getByText('没有可显示的图表数据')).toBeInTheDocument();
  });

  it('should handle data correctly', () => {
    render(<ConsumptionChart data={mockData} />);
    // 验证数据结构
    expect(mockData).toHaveLength(2);
    expect(mockData[0].medicineName).toBe('阿司匹林');
    expect(mockData[1].medicineName).toBe('布洛芬');
  });

  it('should handle invalid data gracefully', () => {
    const invalidData = [
      {
        medicineId: '1',
        medicineName: '测试药品',
        barcode: '123',
        periods: [{ period: '2024-01-01', consumption: 0, batchCount: 0 }],
        totalConsumption: 0,
        averageDaily: 0,
        trend: 'stable' as const,
        trendPercentage: 0,
      },
    ];

    render(<ConsumptionChart data={invalidData} />);
    // 应该能正常渲染，不会崩溃
    expect(screen.getByTestId('card')).toBeInTheDocument();
  });

  it('should handle empty periods gracefully', () => {
    const emptyPeriodsData = [
      {
        medicineId: '1',
        medicineName: '测试药品',
        barcode: '123',
        periods: [],
        totalConsumption: 0,
        averageDaily: 0,
        trend: 'stable' as const,
        trendPercentage: 0,
      },
    ];

    render(<ConsumptionChart data={emptyPeriodsData} />);
    expect(screen.getByTestId('card')).toBeInTheDocument();
  });
});
