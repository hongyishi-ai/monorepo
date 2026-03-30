/**
 * 消耗统计相关的 React Query hooks
 */

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { handleQueryError, queryKeys } from '../lib/query-client';
import { supabase } from '../lib/supabase';

import { TABLES } from '@/lib/db-keys';

// 查询结果中的交易记录类型（包含关联的药品和批次信息）
interface TransactionWithRelations {
  created_at: string;
  quantity: number;
  medicine_id: string;
  medicine: Array<{
    id: string;
    name: string;
    barcode: string;
    specification?: string;
    manufacturer?: string;
    category?: 'internal' | 'external' | 'injection';
  }>;
  batch: Array<{
    id: string;
    batch_number: string;
  }>;
}

// 消耗统计查询参数
export interface ConsumptionStatsParams {
  startDate?: string;
  endDate?: string;
  medicineId?: string;
  groupBy?: 'day' | 'week' | 'month';
  limit?: number;
  // 可选：按交易类型过滤；默认仅统计出库
  types?: Array<'inbound' | 'outbound' | 'adjustment' | 'expired' | 'damaged'>;
}

// 日消耗统计数据
export interface DailyConsumption {
  date: string;
  medicineId: string;
  medicineName: string;
  barcode: string;
  totalOutbound: number;
  batchCount: number;
  specification?: string;
  manufacturer?: string;
  category?: 'internal' | 'external' | 'injection';
}

// 消耗趋势数据
export interface ConsumptionTrend {
  medicineId: string;
  medicineName: string;
  barcode: string;
  periods: {
    period: string;
    consumption: number;
    batchCount: number;
  }[];
  totalConsumption: number;
  averageDaily: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
}

// 消耗汇总数据
export interface ConsumptionSummary {
  totalMedicines: number;
  totalConsumption: number;
  totalTransactions: number;
  averageDaily: number;
  topConsumers: {
    medicineId: string;
    medicineName: string;
    barcode: string;
    consumption: number;
    percentage: number;
  }[];
  periodComparison: {
    currentPeriod: number;
    previousPeriod: number;
    changePercentage: number;
    changeType: 'increase' | 'decrease' | 'stable';
  };
}

// 消耗统计服务
export const consumptionStatsService = {
  // 获取日消耗统计
  async getDailyConsumption(
    params?: ConsumptionStatsParams
  ): Promise<DailyConsumption[]> {
    try {
      // 默认仅统计出库；可通过 params.types 扩展
      const types =
        params?.types && params.types.length > 0 ? params.types : ['outbound'];

      let query = supabase
        .from(TABLES.inventoryTransactions)
        .select(
          `
          created_at,
          quantity,
          medicine_id,
          medicine:medicines (
            id,
            name,
            barcode,
            specification,
            manufacturer,
            category
          ),
           batch:batches (
            id,
            batch_number
          )
        `
        )
        .in('type', types);

      // 日期过滤
      if (params?.startDate) {
        query = query.gte('created_at', params.startDate);
      }
      if (params?.endDate) {
        query = query.lte('created_at', params.endDate);
      }
      if (params?.medicineId) {
        query = query.eq('medicine_id', params.medicineId);
      }

      // 排序
      query = query.order('created_at', { ascending: false });

      // 限制数量
      if (params?.limit) {
        query = query.limit(params.limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      // 按日期和药品分组统计
      const groupedData = new Map<string, DailyConsumption>();

      (data || []).forEach((transaction: TransactionWithRelations) => {
        // Type guard to ensure we have valid transaction data
        if (
          !transaction ||
          typeof transaction !== 'object' ||
          !transaction.created_at
        ) {
          return;
        }

        const date = new Date(transaction.created_at)
          .toISOString()
          .split('T')[0];
        const key = `${date}-${transaction.medicine_id}`;
        const medicine = Array.isArray(transaction.medicine)
          ? transaction.medicine[0]
          : transaction.medicine;

        if (groupedData.has(key)) {
          const existing = groupedData.get(key)!;
          existing.totalOutbound += transaction.quantity || 0;
          existing.batchCount += 1;
        } else {
          groupedData.set(key, {
            date,
            medicineId: transaction.medicine_id || '',
            medicineName: medicine?.name || '',
            barcode: medicine?.barcode || '',
            totalOutbound: transaction.quantity || 0,
            batchCount: 1,
            specification: medicine?.specification,
            manufacturer: medicine?.manufacturer,
            category: medicine?.category || 'internal',
          });
        }
      });

      return Array.from(groupedData.values()).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } catch (error) {
      console.error('获取日消耗统计失败:', error);
      return [];
    }
  },

  // 获取消耗趋势
  async getConsumptionTrend(
    params?: ConsumptionStatsParams
  ): Promise<ConsumptionTrend[]> {
    try {
      const groupBy = params?.groupBy || 'day';
      const dailyData = await this.getDailyConsumption(params);

      // 按药品分组
      const medicineGroups = new Map<string, DailyConsumption[]>();
      dailyData.forEach(item => {
        if (!medicineGroups.has(item.medicineId)) {
          medicineGroups.set(item.medicineId, []);
        }
        medicineGroups.get(item.medicineId)!.push(item);
      });

      const trends: ConsumptionTrend[] = [];

      medicineGroups.forEach((items, medicineId) => {
        const totalConsumption = items.reduce(
          (sum, item) => sum + item.totalOutbound,
          0
        );
        const periods = this.groupByPeriod(items, groupBy);

        // 计算趋势
        const { trend, trendPercentage } = this.calculateTrend(periods);

        // 计算平均日消耗
        const dayCount = Math.max(
          1,
          new Set(items.map(item => item.date)).size
        );
        const averageDaily = totalConsumption / dayCount;

        trends.push({
          medicineId,
          medicineName: items[0].medicineName,
          barcode: items[0].barcode,
          periods,
          totalConsumption,
          averageDaily,
          trend,
          trendPercentage,
        });
      });

      return trends.sort((a, b) => b.totalConsumption - a.totalConsumption);
    } catch (error) {
      console.error('获取消耗趋势失败:', error);
      return [];
    }
  },

  // 获取消耗汇总
  async getConsumptionSummary(
    params?: ConsumptionStatsParams
  ): Promise<ConsumptionSummary> {
    try {
      const dailyData = await this.getDailyConsumption(params);

      const totalMedicines = new Set(dailyData.map(item => item.medicineId))
        .size;
      const totalConsumption = dailyData.reduce(
        (sum, item) => sum + item.totalOutbound,
        0
      );
      const totalTransactions = dailyData.reduce(
        (sum, item) => sum + item.batchCount,
        0
      );

      // 计算日期范围
      const dates = dailyData.map(item => item.date);
      const dayCount = Math.max(1, new Set(dates).size);
      const averageDaily = totalConsumption / dayCount;

      // 计算药品消耗排名
      const medicineConsumption = new Map<
        string,
        {
          medicineId: string;
          medicineName: string;
          barcode: string;
          consumption: number;
        }
      >();

      dailyData.forEach(item => {
        if (medicineConsumption.has(item.medicineId)) {
          medicineConsumption.get(item.medicineId)!.consumption +=
            item.totalOutbound;
        } else {
          medicineConsumption.set(item.medicineId, {
            medicineId: item.medicineId,
            medicineName: item.medicineName,
            barcode: item.barcode,
            consumption: item.totalOutbound,
          });
        }
      });

      const topConsumers = Array.from(medicineConsumption.values())
        .sort((a, b) => b.consumption - a.consumption)
        .slice(0, 10)
        .map(item => ({
          ...item,
          percentage:
            totalConsumption > 0
              ? (item.consumption / totalConsumption) * 100
              : 0,
        }));

      // 计算周期对比（当前周期 vs 上一周期）
      const periodComparison = await this.calculatePeriodComparison(params);

      return {
        totalMedicines,
        totalConsumption,
        totalTransactions,
        averageDaily,
        topConsumers,
        periodComparison,
      };
    } catch (error) {
      console.error('获取消耗汇总失败:', error);
      return {
        totalMedicines: 0,
        totalConsumption: 0,
        totalTransactions: 0,
        averageDaily: 0,
        topConsumers: [],
        periodComparison: {
          currentPeriod: 0,
          previousPeriod: 0,
          changePercentage: 0,
          changeType: 'stable',
        },
      };
    }
  },

  // 按周期分组
  groupByPeriod(items: DailyConsumption[], groupBy: 'day' | 'week' | 'month') {
    const groups = new Map<
      string,
      { consumption: number; batchCount: number }
    >();

    items.forEach(item => {
      let period: string;
      const date = new Date(item.date);

      switch (groupBy) {
        case 'week': {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          period = weekStart.toISOString().split('T')[0];
          break;
        }
        case 'month':
          period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          period = item.date;
      }

      if (groups.has(period)) {
        const existing = groups.get(period)!;
        existing.consumption += item.totalOutbound;
        existing.batchCount += item.batchCount;
      } else {
        groups.set(period, {
          consumption: item.totalOutbound,
          batchCount: item.batchCount,
        });
      }
    });

    return Array.from(groups.entries())
      .map(([period, data]) => ({
        period,
        consumption: data.consumption,
        batchCount: data.batchCount,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  },

  // 计算趋势
  calculateTrend(periods: { period: string; consumption: number }[]) {
    if (periods.length < 2) {
      return { trend: 'stable' as const, trendPercentage: 0 };
    }

    const recent = periods.slice(-3); // 最近3个周期
    const earlier = periods.slice(0, Math.max(1, periods.length - 3)); // 之前的周期

    const recentAvg =
      recent.reduce((sum, p) => sum + p.consumption, 0) / recent.length;
    const earlierAvg =
      earlier.reduce((sum, p) => sum + p.consumption, 0) / earlier.length;

    if (earlierAvg === 0) {
      return { trend: 'stable' as const, trendPercentage: 0 };
    }

    const changePercentage = ((recentAvg - earlierAvg) / earlierAvg) * 100;

    let trend: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(changePercentage) < 5) {
      trend = 'stable';
    } else if (changePercentage > 0) {
      trend = 'increasing';
    } else {
      trend = 'decreasing';
    }

    return { trend, trendPercentage: Math.abs(changePercentage) };
  },

  // 计算周期对比
  async calculatePeriodComparison(params?: ConsumptionStatsParams) {
    try {
      if (!params?.startDate || !params?.endDate) {
        return {
          currentPeriod: 0,
          previousPeriod: 0,
          changePercentage: 0,
          changeType: 'stable' as const,
        };
      }

      const startDate = new Date(params.startDate);
      const endDate = new Date(params.endDate);
      const periodLength = endDate.getTime() - startDate.getTime();

      // 计算上一周期的日期范围
      const prevEndDate = new Date(startDate.getTime() - 1);
      const prevStartDate = new Date(prevEndDate.getTime() - periodLength);

      // 获取当前周期数据
      const currentData = await this.getDailyConsumption(params);
      const currentPeriod = currentData.reduce(
        (sum, item) => sum + item.totalOutbound,
        0
      );

      // 获取上一周期数据
      const prevData = await this.getDailyConsumption({
        ...params,
        startDate: prevStartDate.toISOString().split('T')[0],
        endDate: prevEndDate.toISOString().split('T')[0],
      });
      const previousPeriod = prevData.reduce(
        (sum, item) => sum + item.totalOutbound,
        0
      );

      // 计算变化
      let changePercentage = 0;
      let changeType: 'increase' | 'decrease' | 'stable' = 'stable';

      if (previousPeriod > 0) {
        changePercentage =
          ((currentPeriod - previousPeriod) / previousPeriod) * 100;
        if (Math.abs(changePercentage) >= 5) {
          changeType = changePercentage > 0 ? 'increase' : 'decrease';
        }
      }

      return {
        currentPeriod,
        previousPeriod,
        changePercentage: Math.abs(changePercentage),
        changeType,
      };
    } catch (error) {
      console.error('计算周期对比失败:', error);
      return {
        currentPeriod: 0,
        previousPeriod: 0,
        changePercentage: 0,
        changeType: 'stable' as const,
      };
    }
  },
};

// 获取日消耗统计 hook
export const useDailyConsumption = (params?: ConsumptionStatsParams) => {
  const query = useQuery({
    queryKey: [...queryKeys.inventory.all(), 'daily-consumption', params],
    queryFn: () => consumptionStatsService.getDailyConsumption(params),
    staleTime: 5 * 60 * 1000, // 5分钟
  });

  useEffect(() => {
    if (query.error) {
      handleQueryError(query.error, 'useDailyConsumption');
    }
  }, [query.error]);

  return query;
};

// 获取消耗趋势 hook
export const useConsumptionTrend = (params?: ConsumptionStatsParams) => {
  const query = useQuery({
    queryKey: [...queryKeys.inventory.all(), 'consumption-trend', params],
    queryFn: () => consumptionStatsService.getConsumptionTrend(params),
    staleTime: 10 * 60 * 1000, // 10分钟
  });

  useEffect(() => {
    if (query.error) {
      handleQueryError(query.error, 'useConsumptionTrend');
    }
  }, [query.error]);

  return query;
};

// 获取消耗汇总 hook
export const useConsumptionSummary = (params?: ConsumptionStatsParams) => {
  const query = useQuery({
    queryKey: [...queryKeys.inventory.all(), 'consumption-summary', params],
    queryFn: () => consumptionStatsService.getConsumptionSummary(params),
    staleTime: 5 * 60 * 1000, // 5分钟
  });

  useEffect(() => {
    if (query.error) {
      handleQueryError(query.error, 'useConsumptionSummary');
    }
  }, [query.error]);

  return query;
};
