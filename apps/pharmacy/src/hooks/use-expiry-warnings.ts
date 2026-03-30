/**
 * 近效期药品提醒 Hook
 * 用于获取和管理近效期药品数据
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { SETTINGS, TABLES } from '@/lib/db-keys';
import { supabase } from '@/lib/supabase';
import { useNotificationStore } from '@/stores/notification.store';
import { settingsUtils } from '@/utils/supabase-utils';

// 近效期药品类型
export interface ExpiringMedicine {
  medicine_id: string;
  medicine_name: string;
  barcode: string;
  shelf_location: string | null;
  batch_id: string;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  days_until_expiry: number;
  warning_threshold: number;
}

/**
 * 获取近效期药品列表
 */
async function fetchExpiringMedicines(): Promise<ExpiringMedicine[]> {
  // 方案A：无需依赖视图，直接基于表组合查询出近效期批次
  // 去掉未使用变量，避免 ESLint 报错
  // 默认 30 天，也可从系统设置读取（下方有独立函数）
  const warningDays = await fetchExpiryWarningThreshold();
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + warningDays);

  const { data, error } = await supabase
    .from(TABLES.batches)
    .select(
      `
      id,
      batch_number,
      expiry_date,
      quantity,
      medicine:medicines (
        id,
        name,
        barcode,
        shelf_location
      )
    `
    )
    .gt('quantity', 0)
    .lte('expiry_date', thresholdDate.toISOString().split('T')[0])
    .order('expiry_date', { ascending: true });

  if (error) {
    console.error('获取近效期药品失败:', error);
    throw new Error(`获取近效期药品失败: ${error.message}`);
  }

  type RawRow = {
    id: string;
    batch_number: string;
    expiry_date: string;
    quantity: number;
    medicine?: {
      id?: string;
      name?: string;
      barcode?: string;
      shelf_location?: string | null;
    } | null;
  };

  const result: ExpiringMedicine[] = (
    data as unknown as RawRow[] | null | undefined
  )
    ?.map((row: RawRow) => {
      const med = row.medicine;
      const daysUntil = Math.ceil(
        (new Date(row.expiry_date).getTime() - new Date().getTime()) /
          (24 * 60 * 60 * 1000)
      );
      return {
        medicine_id: med?.id ?? '',
        medicine_name: med?.name ?? '',
        barcode: med?.barcode ?? '',
        shelf_location: med?.shelf_location ?? null,
        batch_id: row.id,
        batch_number: row.batch_number,
        expiry_date: row.expiry_date,
        quantity: row.quantity ?? 0,
        days_until_expiry: daysUntil,
        warning_threshold: warningDays,
      } as ExpiringMedicine;
    })
    // 保证必要字段存在（不强制要求条码，避免误过滤）
    .filter(item => item.medicine_id !== '') as ExpiringMedicine[];

  return result;
}

/**
 * 获取近效期提醒阈值
 */
async function fetchExpiryWarningThreshold(): Promise<number> {
  const value = await settingsUtils.getSettingValue(
    SETTINGS.EXPIRY_WARNING_DAYS,
    '30'
  );
  return parseInt(value || '30', 10);
}

/**
 * 更新近效期提醒阈值
 */
async function updateExpiryWarningThreshold(days: number): Promise<void> {
  await settingsUtils.setSetting(
    SETTINGS.EXPIRY_WARNING_DAYS,
    days.toString(),
    '近效期提醒天数'
  );
}

/**
 * 近效期药品提醒 Hook
 */
export function useExpiryWarnings() {
  const queryClient = useQueryClient();
  const { addReminder } = useNotificationStore();

  // 获取近效期药品
  const {
    data: expiringMedicines = [],
    isLoading,
    error,
    refetch,
  } = useQuery<ExpiringMedicine[]>({
    queryKey: ['expiring-medicines'],
    queryFn: fetchExpiringMedicines,
    staleTime: 5 * 60 * 1000, // 5分钟
  });

  // 处理近效期药品提醒
  useEffect(() => {
    if (expiringMedicines && expiringMedicines.length > 0) {
      addReminder({
        type: 'expiry_warning',
        title: '近效期药品提醒',
        message: `有 ${expiringMedicines.length} 种药品即将过期，请及时处理`,
        priority: expiringMedicines.some(med => med.days_until_expiry <= 7)
          ? 'high'
          : 'medium',
        metadata: {
          count: expiringMedicines.length,
          criticalCount: expiringMedicines.filter(
            med => med.days_until_expiry <= 7
          ).length,
        },
      });
    }
  }, [expiringMedicines, addReminder]);

  // 获取提醒阈值
  const { data: warningThreshold = 30, isLoading: isLoadingThreshold } =
    useQuery({
      queryKey: ['expiry-warning-threshold'],
      queryFn: fetchExpiryWarningThreshold,
      staleTime: 30 * 60 * 1000, // 30分钟
    });

  // 更新提醒阈值
  const updateThresholdMutation = useMutation({
    mutationFn: updateExpiryWarningThreshold,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expiry-warning-threshold'] });
      queryClient.invalidateQueries({ queryKey: ['expiring-medicines'] });
    },
  });

  // 按剩余天数分组
  const groupedByDaysLeft = expiringMedicines.reduce<
    Record<string, ExpiringMedicine[]>
  >((acc, medicine) => {
    let key: string;

    if (medicine.days_until_expiry <= 0) {
      key = '已过期';
    } else if (medicine.days_until_expiry <= 7) {
      key = '7天内';
    } else if (medicine.days_until_expiry <= 15) {
      key = '15天内';
    } else {
      key = '30天内';
    }

    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(medicine);
    return acc;
  }, {});

  // 统计信息
  const stats = {
    total: expiringMedicines.length,
    expired: expiringMedicines.filter(med => med.days_until_expiry <= 0).length,
    critical: expiringMedicines.filter(
      med => med.days_until_expiry > 0 && med.days_until_expiry <= 7
    ).length,
    warning: expiringMedicines.filter(
      med => med.days_until_expiry > 7 && med.days_until_expiry <= 15
    ).length,
    notice: expiringMedicines.filter(med => med.days_until_expiry > 15).length,
  };

  return {
    expiringMedicines,
    groupedByDaysLeft,
    stats,
    warningThreshold,
    isLoading: isLoading || isLoadingThreshold,
    error,
    refetch,
    updateWarningThreshold: (days: number) =>
      updateThresholdMutation.mutate(days),
    isUpdatingThreshold: updateThresholdMutation.isPending,
  };
}
