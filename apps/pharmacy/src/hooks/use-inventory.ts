/**
 * 库存相关的 React Query hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import {
  handleQueryError,
  handleQuerySuccess,
  queryKeys,
} from '../lib/query-client';
import { supabase } from '../lib/supabase';
import type { InventoryTransaction } from '../types/database';

import { RPC, TABLES } from '@/lib/db-keys';
import { getFriendlyMessageForCode } from '@/utils/error-codes';

// 库存交易查询参数
export interface GetInventoryTransactionsParams {
  medicineId?: string;
  batchId?: string;
  userId?: string;
  type?: 'inbound' | 'outbound';
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'quantity';
  sortOrder?: 'asc' | 'desc';
}

// 创建库存交易输入
export interface CreateInventoryTransactionInput {
  medicine_id: string;
  batch_id: string;
  type: 'inbound' | 'outbound' | 'adjustment' | 'expired' | 'damaged';
  quantity: number;
  notes?: string;
  reference_number?: string;
}

// 库存统计数据
export interface InventoryStats {
  totalMedicines: number;
  totalBatches: number;
  lowStockCount: number;
  expiringCount: number;
  expiredCount: number;
  totalValue: number;
}

// 库存汇总数据
export interface InventorySummary {
  medicineId: string;
  medicineName: string;
  barcode: string;
  totalQuantity: number;
  availableBatches: number;
  nearestExpiryDate: string;
  safetyStock: number;
  unit: string;
  isLowStock: boolean;
  isExpiring: boolean;
  isExpired: boolean;
  expiryStatus: 'normal' | 'expiring' | 'expired';
}

// 低库存药品数据（包含批次汇总）
export interface LowStockMedicine {
  id: string;
  name: string;
  barcode: string | null;
  specification: string | null;
  unit: string | null;
  safety_stock: number;
  batches: { quantity: number }[];
}

// 近效期批次数据
export interface ExpiringBatch {
  id: string;
  medicine_id: string;
  batch_number: string;
  quantity: number;
  expiry_date: string;
  production_date: string | null;
  medicine: {
    id: string;
    name: string;
    barcode: string | null;
    specification: string | null;
    manufacturer: string | null;
  };
}

// 已过期批次数据
export interface ExpiredBatch {
  id: string;
  medicine_id: string;
  batch_number: string;
  quantity: number;
  expiry_date: string;
  production_date: string | null;
  medicine: {
    id: string;
    name: string;
    barcode: string | null;
    specification: string | null;
    manufacturer: string | null;
  };
}

// 库存服务
export const inventoryService = {
  // 获取库存交易记录
  async getInventoryTransactions(
    params?: GetInventoryTransactionsParams
  ): Promise<InventoryTransaction[]> {
    console.log('获取库存交易记录，参数:', params);

    let query = supabase.from(TABLES.inventoryTransactions).select(`
        *,
        medicine:medicines (
          id,
          name,
          barcode,
          specification
        ),
        batch:batches (
          id,
          batch_number,
          expiry_date
        ),
        user:users (
          id,
          name
        )
      `);

    // 过滤条件
    if (params?.medicineId) {
      query = query.eq('medicine_id', params.medicineId);
    }
    if (params?.batchId) {
      query = query.eq('batch_id', params.batchId);
    }
    if (params?.userId) {
      query = query.eq('user_id', params.userId);
    }
    if (params?.type) {
      query = query.eq('type', params.type);
    }
    if (params?.startDate) {
      // 确保开始日期包含当天的开始时间（本地时区）
      const startDate = new Date(params.startDate);
      startDate.setHours(0, 0, 0, 0);
      query = query.gte('created_at', startDate.toISOString());
      console.log('开始日期过滤:', startDate.toISOString());
    }
    if (params?.endDate) {
      // 确保结束日期包含当天的结束时间（本地时区）
      const endDate = new Date(params.endDate);
      endDate.setHours(23, 59, 59, 999);
      query = query.lte('created_at', endDate.toISOString());
      console.log('结束日期过滤:', endDate.toISOString());
    }

    // 排序
    const sortBy = params?.sortBy || 'created_at';
    const sortOrder = params?.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // 分页
    if (params?.limit) {
      query = query.limit(params.limit);
    }
    if (params?.offset) {
      query = query.range(
        params.offset,
        params.offset + (params.limit || 50) - 1
      );
    }

    const { data, error } = await query;
    if (error) {
      console.error('获取库存交易记录失败:', error);
      throw error;
    }

    console.log('获取到的库存交易记录:', {
      count: data?.length || 0,
      params,
      firstRecord: data?.[0],
      lastRecord: data?.[data.length - 1],
    });

    return data || [];
  },

  // 获取库存统计
  async getInventoryStats(): Promise<InventoryStats> {
    try {
      // 使用基本查询替代 RPC 函数
      const [medicinesResult, batchesResult] = await Promise.all([
        supabase
          .from(TABLES.medicines)
          .select('id', { count: 'exact', head: true }),
        supabase
          .from(TABLES.batches)
          .select('id', { count: 'exact', head: true })
          .gt('quantity', 0),
      ]);

      // 获取库存不足的药品数量（使用正确的计算逻辑）
      const lowStockMedicines = await inventoryService.getLowStockMedicines();

      // 获取近效期批次数量（不包括已过期）
      const today = new Date().toISOString().split('T')[0];
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const { data: expiringData } = await supabase
        .from(TABLES.batches)
        .select('id')
        .gt('quantity', 0)
        .lte('expiry_date', expiryDate.toISOString().split('T')[0]);

      // 获取已过期批次数量 (包括今天过期的)
      const { data: expiredData } = await supabase
        .from(TABLES.batches)
        .select('id')
        .gt('quantity', 0)
        .lt('expiry_date', today);

      return {
        totalMedicines: medicinesResult.count || 0,
        totalBatches: batchesResult.count || 0,
        lowStockCount: lowStockMedicines?.length || 0,
        expiringCount: expiringData?.length || 0,
        expiredCount: expiredData?.length || 0,
        totalValue: 0, // 需要根据实际业务计算
      };
    } catch (error) {
      console.error('获取库存统计失败:', error);
      return {
        totalMedicines: 0,
        totalBatches: 0,
        lowStockCount: 0,
        expiringCount: 0,
        expiredCount: 0,
        totalValue: 0,
      };
    }
  },

  // 获取库存汇总
  async getInventorySummary(): Promise<InventorySummary[]> {
    try {
      // 使用基本查询替代 RPC 函数
      const { data, error } = await supabase.from(TABLES.medicines).select(`
          id,
          name,
          barcode,
          safety_stock,
          unit,
          batches (
            id,
            batch_number,
            expiry_date,
            quantity
          )
        `);

      if (error) throw error;

      // 处理数据转换为汇总格式
      const summary: InventorySummary[] = (data || []).map(medicine => {
        const totalQuantity =
          medicine.batches?.reduce(
            (sum, batch) => sum + (batch.quantity || 0),
            0
          ) || 0;
        const availableBatches =
          medicine.batches?.filter(batch => (batch.quantity || 0) > 0).length ||
          0;
        const nearestExpiry =
          medicine.batches
            ?.filter(batch => (batch.quantity || 0) > 0)
            ?.sort(
              (a, b) =>
                new Date(a.expiry_date).getTime() -
                new Date(b.expiry_date).getTime()
            )[0]?.expiry_date || '';

        const isLowStock = totalQuantity <= (medicine.safety_stock || 0);

        // 计算有效期状态 - 基于所有有库存的批次
        const activeBatches =
          medicine.batches?.filter(batch => (batch.quantity || 0) > 0) || [];
        const now = Date.now();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

        // 检查是否有已过期的批次
        const hasExpiredBatches = activeBatches.some(
          batch => new Date(batch.expiry_date).getTime() <= now
        );

        // 检查是否有近效期批次（未过期但30天内过期）
        const hasExpiringBatches = activeBatches.some(batch => {
          const expiryTime = new Date(batch.expiry_date).getTime();
          return expiryTime > now && expiryTime <= now + thirtyDaysMs;
        });

        // 确定综合状态
        let expiryStatus: 'normal' | 'expiring' | 'expired';
        let isExpired = false;
        let isExpiring = false;

        if (hasExpiredBatches) {
          expiryStatus = 'expired';
          isExpired = true;
        } else if (hasExpiringBatches) {
          expiryStatus = 'expiring';
          isExpiring = true;
        } else {
          expiryStatus = 'normal';
        }

        return {
          medicineId: medicine.id,
          medicineName: medicine.name,
          barcode: medicine.barcode,
          totalQuantity,
          availableBatches,
          nearestExpiryDate: nearestExpiry,
          safetyStock: medicine.safety_stock || 0,
          unit: medicine.unit || '盒',
          isLowStock,
          isExpiring,
          isExpired,
          expiryStatus,
        };
      });

      return summary;
    } catch (error) {
      console.error('获取库存汇总失败:', error);
      return [];
    }
  },

  // 创建库存交易
  async createInventoryTransaction(
    input: CreateInventoryTransactionInput
  ): Promise<InventoryTransaction> {
    // 获取当前用户ID
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('用户未登录，无法创建库存交易');
    }

    // 验证批次是否存在且有效
    const { data: batch, error: batchError } = await supabase
      .from(TABLES.batches)
      .select('id, quantity, expiry_date, medicine_id')
      .eq('id', input.batch_id)
      .single();

    if (batchError || !batch) {
      throw new Error('批次不存在或已被删除');
    }

    // 检查批次是否过期（同日不过期）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(batch.expiry_date);
    expiry.setHours(0, 0, 0, 0);
    if (expiry < today) {
      throw new Error('批次已过期，无法进行库存操作');
    }

    // 出库时检查库存是否足够
    if (input.type === 'outbound' && batch.quantity < input.quantity) {
      throw new Error(
        `库存不足，当前可用数量: ${batch.quantity}，请求数量: ${input.quantity}`
      );
    }

    // 通过数据库函数原子处理交易与库存
    // 生成参考号（可追踪来源）
    const referenceNumber = input.reference_number ?? `TX_${Date.now()}`;

    const { data: result, error } = await supabase.rpc(
      RPC.processInventoryTransaction,
      {
        p_medicine_id: input.medicine_id,
        p_batch_id: input.batch_id,
        p_type: input.type,
        p_quantity: input.quantity,
        p_user_id: user.id,
        p_notes: input.notes ?? null,
        p_reference_number: referenceNumber,
      }
    );

    if (error) throw error;
    if (!result?.success) {
      const fm = getFriendlyMessageForCode(
        (result as { code?: string })?.code,
        (result as { error?: string })?.error || '库存交易失败'
      );
      throw new Error(fm.message);
    }

    // 返回简化对象，实际查询可由列表/详情刷新获取
    return {
      id: result.transaction_id,
      medicine_id: input.medicine_id,
      batch_id: input.batch_id,
      user_id: user.id,
      type: input.type,
      quantity: input.quantity,
      remaining_quantity: result.new_quantity,
      notes: input.notes ?? null,
      reference_number: referenceNumber,
      created_at: new Date().toISOString(),
    } as unknown as InventoryTransaction;
  },

  // 入库操作
  async inboundInventory(
    input: Omit<CreateInventoryTransactionInput, 'type'>
  ): Promise<InventoryTransaction> {
    return inventoryService.createInventoryTransaction({
      ...input,
      type: 'inbound',
    });
  },

  // 出库操作
  async outboundInventory(
    input: Omit<CreateInventoryTransactionInput, 'type'>
  ): Promise<InventoryTransaction> {
    return inventoryService.createInventoryTransaction({
      ...input,
      type: 'outbound',
    });
  },

  // 获取可撤回的出库交易
  async getReversibleTransactions(
    userId?: string,
    limit: number = 50
  ): Promise<ReversibleTransaction[]> {
    const { data, error } = await supabase.rpc(
      RPC.getReversibleOutboundTransactions,
      {
        p_user_id: userId || null,
        p_limit: limit,
      }
    );

    if (error) throw error;
    return data || [];
  },

  // 撤回出库操作
  async reverseOutboundTransaction(
    input: ReverseTransactionInput
  ): Promise<ReverseTransactionResult> {
    // 获取当前用户ID
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('用户未登录，无法撤回操作');
    }

    const { data, error } = await supabase.rpc(RPC.undoOutboundTransaction, {
      p_transaction_id: input.transaction_id,
      p_user_id: user.id,
    });

    if (error) throw error;

    // data 为 JSON 结果，适配到前端类型
    const result = data as {
      success: boolean;
      restored_quantity?: number;
      error?: string;
    } | null;
    if (!result) throw new Error('撤回操作失败，未返回结果');
    if (!result.success) throw new Error(result.error || '撤回失败');
    return {
      success: true,
      message: '撤回成功',
      reversed_quantity: result.restored_quantity || 0,
    };
  },

  // 获取库存不足的药品
  async getLowStockMedicines(): Promise<LowStockMedicine[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.medicines)
        .select(
          `
          id,
          name,
          barcode,
          specification,
          unit,
          safety_stock,
          batches (
            quantity
          )
        `
        )
        .gt('safety_stock', 0);

      if (error) throw error;

      // 过滤出库存不足的药品
      const lowStockMedicines = (data || []).filter(medicine => {
        const totalQuantity =
          medicine.batches?.reduce(
            (sum, batch) => sum + (batch.quantity || 0),
            0
          ) || 0;
        return totalQuantity <= (medicine.safety_stock || 0);
      });

      return lowStockMedicines;
    } catch (error) {
      console.error('获取库存不足药品失败:', error);
      return [];
    }
  },

  // 获取近效期批次（不包括已过期）
  async getExpiringBatches(days: number = 30): Promise<ExpiringBatch[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);

      const { data, error } = await supabase
        .from(TABLES.batches)
        .select(
          `
          *,
          medicine:medicines (
            id,
            name,
            barcode,
            specification,
            manufacturer
          )
        `
        )
        .gt('quantity', 0)
        .gt('expiry_date', today) // 排除已过期的
        .lte('expiry_date', expiryDate.toISOString().split('T')[0])
        .order('expiry_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('获取近效期批次失败:', error);
      return [];
    }
  },

  // 获取已过期批次
  async getExpiredBatches(): Promise<ExpiredBatch[]> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from(TABLES.batches)
        .select(
          `
          *,
          medicine:medicines (
            id,
            name,
            barcode,
            specification,
            manufacturer
          )
        `
        )
        .gt('quantity', 0)
        .lte('expiry_date', today) // 只包括已过期的
        .order('expiry_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('获取已过期批次失败:', error);
      return [];
    }
  },
};

// 获取库存交易记录 hook
export const useInventoryTransactions = (
  params?: GetInventoryTransactionsParams
) => {
  const query = useQuery({
    queryKey: [...queryKeys.inventory.transactions(), params],
    queryFn: () => inventoryService.getInventoryTransactions(params),
  });

  // Handle errors
  useEffect(() => {
    if (query.error) {
      handleQueryError(query.error, 'useInventoryTransactions');
    }
  }, [query.error]);

  return query;
};

// 获取库存统计 hook
export const useInventoryStats = () => {
  const query = useQuery({
    queryKey: queryKeys.inventory.summary(),
    queryFn: () => inventoryService.getInventoryStats(),
    staleTime: 2 * 60 * 1000, // 2分钟
  });

  // Handle errors
  useEffect(() => {
    if (query.error) {
      handleQueryError(query.error, 'useInventoryStats');
    }
  }, [query.error]);

  return query;
};

// 获取库存汇总 hook
export const useInventorySummary = () => {
  const query = useQuery({
    queryKey: [...queryKeys.inventory.all(), 'summary-detail'],
    queryFn: () => inventoryService.getInventorySummary(),
    staleTime: 5 * 60 * 1000, // 5分钟
  });

  // Handle errors
  useEffect(() => {
    if (query.error) {
      handleQueryError(query.error, 'useInventorySummary');
    }
  }, [query.error]);

  return query;
};

// 获取库存不足药品 hook
export const useLowStockMedicines = () => {
  const query = useQuery({
    queryKey: queryKeys.inventory.lowStock(),
    queryFn: () => inventoryService.getLowStockMedicines(),
    staleTime: 2 * 60 * 1000, // 2分钟
  });

  // Handle errors
  useEffect(() => {
    if (query.error) {
      handleQueryError(query.error, 'useLowStockMedicines');
    }
  }, [query.error]);

  return query;
};

// 获取近效期批次 hook
export const useExpiringBatches = (days: number = 30) => {
  const query = useQuery({
    queryKey: queryKeys.inventory.expiring(days),
    queryFn: () => inventoryService.getExpiringBatches(days),
    staleTime: 5 * 60 * 1000, // 5分钟
  });

  // Handle errors
  useEffect(() => {
    if (query.error) {
      handleQueryError(query.error, 'useExpiringBatches');
    }
  }, [query.error]);

  return query;
};

// 获取已过期批次 hook
export const useExpiredBatches = () => {
  const query = useQuery({
    queryKey: [...queryKeys.inventory.all(), 'expired'],
    queryFn: () => inventoryService.getExpiredBatches(),
    staleTime: 5 * 60 * 1000, // 5分钟
  });

  // Handle errors
  useEffect(() => {
    if (query.error) {
      handleQueryError(query.error, 'useExpiredBatches');
    }
  }, [query.error]);

  return query;
};

// 创建库存交易 hook
export const useCreateInventoryTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inventoryService.createInventoryTransaction,
    onSuccess: data => {
      // 使库存相关查询无效
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() });
      // 使批次查询无效
      queryClient.invalidateQueries({
        queryKey: queryKeys.batches.detail(data.batch_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.batches.byMedicine(data.medicine_id),
      });

      const actionText = data.type === 'inbound' ? '入库' : '出库';
      handleQuerySuccess(`${actionText}操作成功`, '操作成功');
    },
    onError: error => {
      console.error('创建库存交易失败:', error);
    },
  });
};

// 入库操作 hook
export const useInboundInventory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inventoryService.inboundInventory,
    onSuccess: data => {
      // 使库存相关查询无效
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() });
      // 使批次查询无效
      queryClient.invalidateQueries({
        queryKey: queryKeys.batches.detail(data.batch_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.batches.byMedicine(data.medicine_id),
      });

      handleQuerySuccess('入库操作成功', '入库成功');
    },
    onError: error => {
      console.error('入库操作失败:', error);
    },
  });
};

// 出库操作 hook
export const useOutboundInventory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inventoryService.outboundInventory,
    onSuccess: data => {
      // 使库存相关查询无效
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() });
      // 使批次查询无效
      queryClient.invalidateQueries({
        queryKey: queryKeys.batches.detail(data.batch_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.batches.byMedicine(data.medicine_id),
      });

      handleQuerySuccess('出库操作成功', '出库成功');
    },
    onError: error => {
      console.error('出库操作失败:', error);
    },
  });
};

// 撤回出库操作相关类型
export interface ReversibleTransaction {
  transaction_id: string;
  medicine_name: string;
  batch_number: string;
  quantity: number;
  unit: string;
  operator_name: string;
  created_at: string;
  hours_since_transaction: number;
  can_reverse: boolean;
  notes: string;
}

export interface ReverseTransactionInput {
  transaction_id: string;
  reason?: string;
}

export interface ReverseTransactionResult {
  success: boolean;
  message: string;
  reversed_quantity: number;
}

// 获取可撤回交易 hook
export const useReversibleTransactions = (userId?: string, limit?: number) => {
  const query = useQuery({
    queryKey: [...queryKeys.inventory.all(), 'reversible', userId, limit],
    queryFn: () => inventoryService.getReversibleTransactions(userId, limit),
    staleTime: 1 * 60 * 1000, // 1分钟
  });

  // Handle errors
  useEffect(() => {
    if (query.error) {
      handleQueryError(query.error, 'useReversibleTransactions');
    }
  }, [query.error]);

  return query;
};

// 撤回出库操作 hook
export const useReverseOutboundTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inventoryService.reverseOutboundTransaction,
    onSuccess: data => {
      // 使库存相关查询无效
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() });
      // 使可撤回交易查询无效
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.inventory.all(), 'reversible'],
      });

      handleQuerySuccess(
        '撤回成功',
        `已成功撤回 ${data.reversed_quantity} 个单位的出库操作`
      );
    },
    onError: error => {
      console.error('撤回出库操作失败:', error);
    },
  });
};

// 库存工具 hooks
export const useInventoryUtils = () => {
  const queryClient = useQueryClient();

  return {
    // 刷新所有库存数据
    refreshInventory: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() });
    },

    // 刷新库存统计
    refreshStats: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.summary(),
      });
    },

    // 刷新库存交易记录
    refreshTransactions: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.transactions(),
      });
    },

    // 清除库存缓存
    clearInventoryCache: () => {
      queryClient.removeQueries({ queryKey: queryKeys.inventory.all() });
    },

    // 预取库存数据
    prefetchInventoryStats: () => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.inventory.summary(),
        queryFn: () => inventoryService.getInventoryStats(),
        staleTime: 2 * 60 * 1000, // 2分钟
      });
    },
  };
};
