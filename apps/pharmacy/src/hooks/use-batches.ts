/**
 * 批次相关的 React Query hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import {
  handleQueryError,
  handleQuerySuccess,
  queryKeys,
} from '../lib/query-client';
import { supabase } from '../lib/supabase';
import type { Batch } from '../types/database';

import { RPC, TABLES } from '@/lib/db-keys';
import { getFriendlyMessageForCode } from '@/utils/error-codes';

// 批次查询参数
export interface GetBatchesParams {
  medicineId?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'batch_number' | 'production_date' | 'expiry_date' | 'quantity';
  sortOrder?: 'asc' | 'desc';
  includeExpired?: boolean;
  includeEmpty?: boolean;
}

// 创建批次输入
export interface CreateBatchInput {
  medicine_id: string;
  batch_number: string;
  production_date: string;
  expiry_date: string;
  quantity: number;
}

// 首次入库：创建批次并入库（单RPC）输入
export interface CreateBatchAndInboundInput {
  medicine_id: string;
  batch_number: string;
  production_date: string; // YYYY-MM-DD
  expiry_date: string; // YYYY-MM-DD
  quantity: number;
  notes?: string;
}

export interface CreateBatchAndInboundResult {
  success: boolean;
  error?: string;
  batch_exists?: boolean;
  batch_id?: string;
  created_batch?: boolean;
  transaction_id?: string;
  new_quantity?: number;
}

// 更新批次输入
export interface UpdateBatchInput
  extends Partial<Omit<CreateBatchInput, 'medicine_id'>> {
  id: string;
}

// 批次服务
export const batchService = {
  // 获取批次列表
  async getBatches(params?: GetBatchesParams): Promise<Batch[]> {
    let query = supabase.from(TABLES.batches).select(`
        *,
        medicine:medicines (
          id,
          name,
          barcode,
          specification,
          manufacturer
        )
      `);

    // 药品过滤
    if (params?.medicineId) {
      query = query.eq('medicine_id', params.medicineId);
    }

    // 搜索过滤
    if (params?.search) {
      query = query.ilike('batch_number', `%${params.search}%`);
    }

    // 是否包含过期批次
    if (!params?.includeExpired) {
      query = query.gte('expiry_date', new Date().toISOString().split('T')[0]);
    }

    // 是否包含空批次
    if (!params?.includeEmpty) {
      query = query.gt('quantity', 0);
    }

    // 排序
    const sortBy = params?.sortBy || 'expiry_date';
    const sortOrder = params?.sortOrder || 'asc';
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
    if (error) throw error;
    return data || [];
  },

  // 获取单个批次
  async getBatch(id: string): Promise<Batch> {
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
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // 获取药品的批次列表
  async getBatchesByMedicine(medicineId: string): Promise<Batch[]> {
    return this.getBatches({ medicineId });
  },

  // 获取近效期批次
  async getExpiringBatches(days: number = 30): Promise<Batch[]> {
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
      .gte('expiry_date', new Date().toISOString().split('T')[0])
      .lte('expiry_date', expiryDate.toISOString().split('T')[0])
      .order('expiry_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // 获取已过期批次
  async getExpiredBatches(): Promise<Batch[]> {
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
      .lt('expiry_date', new Date().toISOString().split('T')[0])
      .order('expiry_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // 创建批次
  async createBatch(input: CreateBatchInput): Promise<Batch> {
    // 先插入批次数据
    const { data: batchData, error: insertError } = await supabase
      .from(TABLES.batches)
      .insert(input)
      .select('*')
      .single();

    if (insertError) throw insertError;

    // 然后获取包含medicine信息的完整数据
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
      .eq('id', batchData.id)
      .single();

    if (error) throw error;
    return data;
  },

  // 更新批次
  async updateBatch(input: UpdateBatchInput): Promise<Batch> {
    const { id, ...updateData } = input;
    const { data, error } = await supabase
      .from(TABLES.batches)
      .update(updateData)
      .eq('id', id)
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
      .single();

    if (error) throw error;
    return data;
  },

  // 检查批次依赖关系
  async checkBatchDependencies(id: string): Promise<{
    success: boolean;
    medicine_name?: string;
    batch_number?: string;
    transaction_count?: number;
    can_delete?: boolean;
    error?: string;
  }> {
    const { data, error } = await supabase.rpc(RPC.getBatchDependencies, {
      batch_id_param: id,
    });

    if (error) throw error;
    return data;
  },

  // 安全删除批次（带确认）
  async safeDeleteBatch(
    id: string,
    confirmDelete: boolean = false
  ): Promise<{
    success: boolean;
    warning?: boolean;
    message?: string;
    medicine_name?: string;
    batch_number?: string;
    transaction_count?: number;
    deleted_transactions?: number;
    error?: string;
  }> {
    const { data, error } = await supabase.rpc(RPC.safeDeleteBatch, {
      batch_id_param: id,
      confirm_delete: confirmDelete,
    });

    if (error) throw error;
    return data;
  },

  // 删除批次（保留原有接口，但使用级联删除）
  async deleteBatch(id: string): Promise<void> {
    const result = await this.safeDeleteBatch(id, true);

    if (!result.success) {
      throw new Error(result.error || '删除批次失败');
    }
  },

  // 更新批次数量
  async updateBatchQuantity(id: string, quantity: number): Promise<Batch> {
    const { data, error } = await supabase
      .from(TABLES.batches)
      .update({ quantity })
      .eq('id', id)
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
      .single();

    if (error) throw error;
    return data;
  },

  // 首次入库：创建批次并入库（单RPC，原子化）
  async createBatchAndInbound(
    input: CreateBatchAndInboundInput
  ): Promise<CreateBatchAndInboundResult> {
    // 获取当前用户ID
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('用户未登录，无法执行入库');
    }

    const { data, error } = await supabase.rpc(RPC.createBatchAndInbound, {
      p_medicine_id: input.medicine_id,
      p_batch_number: input.batch_number,
      p_production_date: input.production_date,
      p_expiry_date: input.expiry_date,
      p_quantity: input.quantity,
      p_user_id: user.id,
      p_notes: input.notes ?? null,
    });

    if (error) throw error;
    const result = (data || {}) as CreateBatchAndInboundResult & {
      code?: string;
    };

    if (!result.success) {
      // 提供更友好的错误消息
      const fm = getFriendlyMessageForCode(result.code, result.error);
      // 特殊分支：批次已存在
      if (result.batch_exists && result.batch_id) {
        return result; // 上层已有合并流程
      }
      throw new Error(fm.message);
    }

    return result;
  },
};

// 获取批次列表 hook
export const useBatches = (params?: GetBatchesParams) => {
  const query = useQuery({
    queryKey: queryKeys.batches.list(params?.medicineId),
    queryFn: () => batchService.getBatches(params),
  });

  // Handle errors
  useEffect(() => {
    if (query.error) {
      handleQueryError(query.error, 'useBatches');
    }
  }, [query.error]);

  return query;
};

// 获取单个批次 hook
export const useBatch = (id: string, enabled: boolean = true) => {
  const query = useQuery({
    queryKey: queryKeys.batches.detail(id),
    queryFn: () => batchService.getBatch(id),
    enabled: enabled && !!id,
  });

  // Handle errors
  useEffect(() => {
    if (query.error) {
      handleQueryError(query.error, 'useBatch');
    }
  }, [query.error]);

  return query;
};

// 获取药品的批次列表 hook
export const useBatchesByMedicine = (
  medicineId: string,
  enabled: boolean = true
) => {
  const query = useQuery({
    queryKey: queryKeys.batches.byMedicine(medicineId),
    queryFn: () => batchService.getBatchesByMedicine(medicineId),
    enabled: enabled && !!medicineId,
  });

  // Handle errors
  useEffect(() => {
    if (query.error) {
      handleQueryError(query.error, 'useBatchesByMedicine');
    }
  }, [query.error]);

  return query;
};

// 获取近效期批次 hook
export const useExpiringBatches = (days: number = 30) => {
  const query = useQuery({
    queryKey: queryKeys.inventory.expiring(days),
    queryFn: () => batchService.getExpiringBatches(days),
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
    queryKey: [...queryKeys.batches.all(), 'expired'],
    queryFn: () => batchService.getExpiredBatches(),
  });

  // Handle errors
  useEffect(() => {
    if (query.error) {
      handleQueryError(query.error, 'useExpiredBatches');
    }
  }, [query.error]);

  return query;
};

// 创建批次 hook
export const useCreateBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: batchService.createBatch,
    onSuccess: data => {
      // 使批次列表查询无效
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.lists() });
      // 使药品的批次查询无效
      queryClient.invalidateQueries({
        queryKey: queryKeys.batches.byMedicine(data.medicine_id),
      });
      // 使库存相关查询无效
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() });
      handleQuerySuccess('批次创建成功', '创建成功');
    },
    onError: error => {
      console.error('创建批次失败:', error);

      // 处理具体的错误类型
      let errorMessage = '创建批次失败';
      if (error instanceof Error) {
        if (
          error.message.includes(
            'duplicate key value violates unique constraint "batches_medicine_id_batch_number_key"'
          )
        ) {
          errorMessage = '该药品的批次号已存在，请使用不同的批次号';
        } else if (
          error.message.includes(
            'duplicate key value violates unique constraint'
          )
        ) {
          errorMessage = '批次信息重复，请检查输入';
        } else if (error.message.includes('violates foreign key constraint')) {
          errorMessage = '药品信息不存在，请刷新页面后重试';
        } else if (error.message.includes('permission denied')) {
          errorMessage = '权限不足，无法创建批次';
        } else {
          errorMessage = error.message;
        }
      }

      // 抛出处理后的错误，让上层组件能够获取到详细信息
      throw new Error(errorMessage);
    },
  });
};

// 首次入库：创建批次并入库（单RPC） hook
export const useCreateBatchAndInbound = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: batchService.createBatchAndInbound,
    onSuccess: (result, variables) => {
      // 无论是否返回 batch_id，都统一刷新相关列表，避免页面不更新
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.lists() });
      if (variables?.medicine_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.batches.byMedicine(variables.medicine_id),
        });
      }
      if (result?.batch_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.batches.detail(result.batch_id),
        });
      }
      if (result?.success) {
        handleQuerySuccess('入库操作成功', '入库成功');
      }
    },
    onError: error => {
      console.error('创建批次并入库失败:', error);
    },
  });
};

// 更新批次 hook
export const useUpdateBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: batchService.updateBatch,
    onSuccess: data => {
      // 更新缓存中的批次数据
      queryClient.setQueryData(queryKeys.batches.detail(data.id), data);
      // 使批次列表查询无效
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.lists() });
      // 使药品的批次查询无效
      queryClient.invalidateQueries({
        queryKey: queryKeys.batches.byMedicine(data.medicine_id),
      });
      // 使库存相关查询无效
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() });
      handleQuerySuccess('批次更新成功', '更新成功');
    },
    onError: error => {
      console.error('更新批次失败:', error);
    },
  });
};

// 删除批次 hook
export const useDeleteBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: batchService.deleteBatch,
    onSuccess: (_, deletedId) => {
      // 从缓存中移除批次数据
      queryClient.removeQueries({
        queryKey: queryKeys.batches.detail(deletedId),
      });
      // 使批次列表查询无效
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.lists() });
      // 使库存相关查询无效
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() });
      handleQuerySuccess('批次删除成功', '删除成功');
    },
    onError: error => {
      console.error('删除批次失败:', error);

      // 处理特定的错误类型
      let errorMessage = '删除批次失败，请稍后重试';
      let errorTitle = '删除失败';

      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as { code: string | number }).code;

        if (errorCode === '23503') {
          // 外键约束违反错误 - 通常表示有关联数据
          errorMessage =
            '该批次存在关联的库存交易记录，无法删除。请先处理相关记录。';
          errorTitle = '无法删除';
        } else if (errorCode === '42501') {
          // 权限不足
          errorMessage = '您没有权限删除该批次';
          errorTitle = '权限不足';
        }
      }

      handleQueryError(errorTitle, errorMessage);
    },
  });
};

// 更新批次数量 hook
export const useUpdateBatchQuantity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      batchService.updateBatchQuantity(id, quantity),
    onSuccess: data => {
      // 更新缓存中的批次数据
      queryClient.setQueryData(queryKeys.batches.detail(data.id), data);
      // 使批次列表查询无效
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.lists() });
      // 使药品的批次查询无效
      queryClient.invalidateQueries({
        queryKey: queryKeys.batches.byMedicine(data.medicine_id),
      });
      // 使库存相关查询无效
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() });
    },
    onError: error => {
      console.error('更新批次数量失败:', error);
    },
  });
};

// 批次数据工具 hooks
export const useBatchUtils = () => {
  const queryClient = useQueryClient();

  return {
    // 刷新批次列表
    refreshBatches: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.lists() });
    },

    // 刷新单个批次
    refreshBatch: (id: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.detail(id) });
    },

    // 刷新药品的批次
    refreshMedicineBatches: (medicineId: string) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.batches.byMedicine(medicineId),
      });
    },

    // 清除批次缓存
    clearBatchCache: () => {
      queryClient.removeQueries({ queryKey: queryKeys.batches.all() });
    },

    // 预取批次数据
    prefetchBatch: (id: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.batches.detail(id),
        queryFn: () => batchService.getBatch(id),
        staleTime: 10 * 60 * 1000, // 10分钟
      });
    },
  };
};
