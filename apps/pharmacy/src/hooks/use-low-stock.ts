/**
 * 库存不足提醒 Hook
 * 用于获取和管理库存不足药品数据
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { SETTINGS, TABLES } from '@/lib/db-keys';
import { supabase } from '@/lib/supabase';
import { useNotificationStore } from '@/stores/notification.store';
import { settingsUtils } from '@/utils/supabase-utils';

// 库存不足药品类型
export interface LowStockMedicine {
  id: string;
  name: string;
  barcode: string;
  shelf_location: string | null;
  unit: string;
  safety_stock: number;
  total_quantity: number;
  shortage: number;
}

/**
 * 获取库存不足药品列表
 */
async function fetchLowStockMedicines(): Promise<LowStockMedicine[]> {
  // 方案A：通过聚合查询实时计算库存不足药品
  // 获取阈值可选：此处不强制依赖阈值，只按 safety_stock 对比
  const { data, error } = await supabase.from(TABLES.medicines).select(
    `
      id,
      name,
      barcode,
      shelf_location,
      unit,
      safety_stock,
      batches(quantity)
    `
  );

  if (error) {
    console.error('获取库存不足药品失败:', error);
    throw new Error(`获取库存不足药品失败: ${error.message}`);
  }

  type MedicineRow = {
    id: string;
    name: string;
    barcode: string;
    shelf_location: string | null;
    unit?: string | null;
    safety_stock: number;
    batches?: Array<{ quantity: number } | null> | null;
  };
  const result: LowStockMedicine[] = (data || [])
    .map((m: MedicineRow) => {
      const total = (m.batches || []).reduce(
        (sum: number, b: { quantity: number } | null) =>
          sum + (b?.quantity || 0),
        0
      );
      const shortage = Math.max(0, (m.safety_stock || 0) - total);
      return {
        id: m.id,
        name: m.name,
        barcode: m.barcode,
        shelf_location: m.shelf_location ?? null,
        unit: m.unit || '盒',
        safety_stock: m.safety_stock || 0,
        total_quantity: total,
        shortage,
      } as LowStockMedicine;
    })
    .filter(item => item.total_quantity <= item.safety_stock)
    .sort((a, b) => b.shortage - a.shortage);

  return result;
}

/**
 * 获取库存不足提醒阈值
 */
async function fetchLowStockThreshold(): Promise<number> {
  const value = await settingsUtils.getSettingValue(
    SETTINGS.LOW_STOCK_THRESHOLD,
    '10'
  );
  return parseInt(value || '10', 10);
}

/**
 * 更新库存不足提醒阈值
 */
async function updateLowStockThreshold(threshold: number): Promise<void> {
  await settingsUtils.setSetting(
    SETTINGS.LOW_STOCK_THRESHOLD,
    threshold.toString(),
    '库存不足提醒阈值'
  );
}

/**
 * 库存不足提醒 Hook
 */
export function useLowStock() {
  const queryClient = useQueryClient();
  const { addReminder } = useNotificationStore();

  // 获取库存不足药品
  const {
    data: lowStockMedicines = [],
    isLoading,
    error,
    refetch,
  } = useQuery<LowStockMedicine[]>({
    queryKey: ['low-stock-medicines'],
    queryFn: fetchLowStockMedicines,
    staleTime: 5 * 60 * 1000, // 5分钟
  });

  // 处理库存不足提醒
  useEffect(() => {
    if (lowStockMedicines && lowStockMedicines.length > 0) {
      addReminder({
        type: 'stock_low',
        title: '库存不足提醒',
        message: `有 ${lowStockMedicines.length} 种药品库存不足，建议及时补货`,
        priority: lowStockMedicines.some(med => med.total_quantity === 0)
          ? 'high'
          : 'medium',
        metadata: {
          count: lowStockMedicines.length,
          outOfStockCount: lowStockMedicines.filter(
            med => med.total_quantity === 0
          ).length,
        },
      });
    }
  }, [lowStockMedicines, addReminder]);

  // 获取提醒阈值
  const { data: lowStockThreshold = 10, isLoading: isLoadingThreshold } =
    useQuery({
      queryKey: ['low-stock-threshold'],
      queryFn: fetchLowStockThreshold,
      staleTime: 30 * 60 * 1000, // 30分钟
    });

  // 更新提醒阈值
  const updateThresholdMutation = useMutation({
    mutationFn: updateLowStockThreshold,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['low-stock-threshold'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-medicines'] });
    },
  });

  // 按缺货程度分组
  const groupedByShortage = lowStockMedicines.reduce<
    Record<string, LowStockMedicine[]>
  >((acc, medicine) => {
    let key: string;

    if (medicine.total_quantity === 0) {
      key = '完全缺货';
    } else if (medicine.shortage >= medicine.safety_stock * 0.8) {
      key = '严重不足';
    } else if (medicine.shortage >= medicine.safety_stock * 0.5) {
      key = '中度不足';
    } else {
      key = '轻度不足';
    }

    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(medicine);
    return acc;
  }, {});

  // 统计信息
  const stats = {
    total: lowStockMedicines.length,
    outOfStock: lowStockMedicines.filter(med => med.total_quantity === 0)
      .length,
    critical: lowStockMedicines.filter(
      med => med.total_quantity > 0 && med.shortage >= med.safety_stock * 0.8
    ).length,
    warning: lowStockMedicines.filter(
      med =>
        med.total_quantity > 0 &&
        med.shortage >= med.safety_stock * 0.5 &&
        med.shortage < med.safety_stock * 0.8
    ).length,
    notice: lowStockMedicines.filter(
      med => med.total_quantity > 0 && med.shortage < med.safety_stock * 0.5
    ).length,
  };

  return {
    lowStockMedicines,
    groupedByShortage,
    stats,
    lowStockThreshold,
    isLoading: isLoading || isLoadingThreshold,
    error,
    refetch,
    updateLowStockThreshold: (threshold: number) =>
      updateThresholdMutation.mutate(threshold),
    isUpdatingThreshold: updateThresholdMutation.isPending,
  };
}
