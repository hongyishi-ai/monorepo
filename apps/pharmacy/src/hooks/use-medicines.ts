/**
 * 药品相关的 React Query hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import {
  handleQueryError,
  handleQuerySuccess,
  queryKeys,
} from '../lib/query-client';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/auth.store';
import type { Medicine } from '../types/database';
import { withAuditContext } from '../utils/audit-context';

import { RPC, TABLES } from '@/lib/db-keys';

// 药品查询参数
export interface GetMedicinesParams {
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
}

// 创建药品输入
export interface CreateMedicineInput {
  barcode: string;
  name: string;
  specification: string;
  manufacturer: string;
  shelf_location?: string;
  safety_stock?: number;
  unit?: string;
  category?: 'internal' | 'external' | 'injection';
}

// 更新药品输入
export interface UpdateMedicineInput extends Partial<CreateMedicineInput> {
  id: string;
}

// 药品服务
export const medicineService = {
  // 获取药品列表
  async getMedicines(params?: GetMedicinesParams): Promise<Medicine[]> {
    let query = supabase.from(TABLES.medicines).select(`
        *,
        batches (
          id,
          batch_number,
          production_date,
          expiry_date,
          quantity
        )
      `);

    // 搜索过滤
    if (params?.search) {
      query = query.or(
        `name.ilike.%${params.search}%,barcode.ilike.%${params.search}%,manufacturer.ilike.%${params.search}%`
      );
    }

    // 排序
    const sortBy = params?.sortBy || 'name';
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

  // 获取单个药品
  async getMedicine(id: string): Promise<Medicine> {
    const { data, error } = await supabase
      .from(TABLES.medicines)
      .select(
        `
        *,
        batches (
          id,
          batch_number,
          production_date,
          expiry_date,
          quantity
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // 根据条码获取药品
  async getMedicineByBarcode(barcode: string): Promise<Medicine | null> {
    const { data, error } = await supabase
      .from(TABLES.medicines)
      .select(
        `
        *,
        batches (
          id,
          batch_number,
          production_date,
          expiry_date,
          quantity
        )
      `
      )
      .eq('barcode', barcode)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // 创建药品
  async createMedicine(
    input: CreateMedicineInput,
    userId?: string
  ): Promise<Medicine> {
    const operation = async () => {
      const { data, error } = await supabase
        .from(TABLES.medicines)
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    };

    if (userId) {
      return withAuditContext(userId, operation);
    } else {
      return operation();
    }
  },

  // 更新药品
  async updateMedicine(
    input: UpdateMedicineInput,
    userId?: string
  ): Promise<Medicine> {
    const { id, ...updateData } = input;

    const operation = async () => {
      const { data, error } = await supabase
        .from(TABLES.medicines)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    };

    if (userId) {
      return withAuditContext(userId, operation);
    } else {
      return operation();
    }
  },

  // 检查药品依赖关系
  async checkMedicineDependencies(id: string): Promise<{
    success: boolean;
    medicine_name?: string;
    transaction_count?: number;
    batch_count?: number;
    can_delete?: boolean;
    error?: string;
  }> {
    const { data, error } = await supabase.rpc(RPC.getMedicineDependencies, {
      medicine_id_param: id,
    });

    if (error) throw error;
    return data;
  },

  // 安全删除药品（带确认）
  async safeDeleteMedicine(
    id: string,
    confirmDelete: boolean = false,
    userId?: string
  ): Promise<{
    success: boolean;
    warning?: boolean;
    message?: string;
    medicine_name?: string;
    transaction_count?: number;
    batch_count?: number;
    deleted_transactions?: number;
    deleted_batches?: number;
    error?: string;
  }> {
    const operation = async () => {
      const { data, error } = await supabase.rpc(RPC.safeDeleteMedicine, {
        medicine_id_param: id,
        confirm_delete: confirmDelete,
      });

      if (error) throw error;
      return data;
    };

    if (userId) {
      return withAuditContext(userId, operation);
    } else {
      return operation();
    }
  },

  // 删除药品（保留原有接口，但使用级联删除）
  async deleteMedicine(id: string, userId?: string): Promise<void> {
    const result = await this.safeDeleteMedicine(id, true, userId);

    if (!result.success) {
      throw new Error(result.error || '删除药品失败');
    }
  },

  // 搜索药品
  async searchMedicines(query: string): Promise<Medicine[]> {
    return this.getMedicines({ search: query, limit: 20 });
  },
};

// 获取药品列表 hook
export const useMedicines = (params?: GetMedicinesParams) => {
  const query = useQuery({
    queryKey: queryKeys.medicines.list(params as Record<string, unknown>),
    queryFn: () => medicineService.getMedicines(params),
  });

  // Handle errors
  useEffect(() => {
    if (query.error) {
      handleQueryError(query.error, 'useMedicines');
    }
  }, [query.error]);

  return query;
};

// 获取单个药品 hook
export const useMedicine = (id: string, enabled: boolean = true) => {
  const query = useQuery({
    queryKey: queryKeys.medicines.detail(id),
    queryFn: () => medicineService.getMedicine(id),
    enabled: enabled && !!id,
  });

  // Handle errors
  useEffect(() => {
    if (query.error) {
      handleQueryError(query.error, 'useMedicine');
    }
  }, [query.error]);

  return query;
};

// 根据条码获取药品 hook
export const useMedicineByBarcode = (
  barcode: string,
  enabled: boolean = true
) => {
  const [debouncedBarcode, setDebouncedBarcode] = useState(barcode);

  // 防抖处理，避免频繁查询
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedBarcode(barcode);
    }, 300); // 300ms 防抖

    return () => clearTimeout(timer);
  }, [barcode]);

  const query = useQuery({
    queryKey: [...queryKeys.medicines.all(), 'barcode', debouncedBarcode],
    queryFn: () => medicineService.getMedicineByBarcode(debouncedBarcode),
    enabled: enabled && !!debouncedBarcode && debouncedBarcode.length >= 8,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    retry: 1, // 只重试1次
  });

  // Handle errors
  useEffect(() => {
    if (query.error) {
      handleQueryError(query.error, 'useMedicineByBarcode');
    }
  }, [query.error]);

  return query;
};

// 搜索药品 hook
export const useSearchMedicines = (query: string, enabled: boolean = true) => {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // 防抖处理，减少数据库查询频率
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500); // 500ms 防抖，比条码查询更长

    return () => clearTimeout(timer);
  }, [query]);

  const queryResult = useQuery({
    queryKey: queryKeys.medicines.search(debouncedQuery),
    queryFn: () => medicineService.searchMedicines(debouncedQuery),
    enabled: enabled && !!debouncedQuery && debouncedQuery.length >= 2,
    staleTime: 2 * 60 * 1000, // 2分钟缓存
    retry: 1, // 只重试1次
  });

  // Handle errors
  useEffect(() => {
    if (queryResult.error) {
      handleQueryError(queryResult.error, 'useSearchMedicines');
    }
  }, [queryResult.error]);

  return queryResult;
};

// 创建药品 hook
export const useCreateMedicine = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (input: CreateMedicineInput) =>
      medicineService.createMedicine(input, user?.id),
    onSuccess: () => {
      // 使药品列表查询无效
      queryClient.invalidateQueries({ queryKey: queryKeys.medicines.lists() });
      handleQuerySuccess('药品创建成功', '创建成功');
    },
    onError: error => {
      console.error('创建药品失败:', error);

      // 处理特定的错误类型
      let errorMessage = '创建药品失败，请稍后重试';
      let errorTitle = '创建失败';

      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as { code: string | number }).code;
        const errorMsg = (error as { message?: string }).message || '';

        if (errorCode === '23505' || errorCode === 23505) {
          // 唯一约束违反错误
          if (errorMsg.includes('medicines_barcode_key')) {
            errorMessage = '该条码已存在，请检查条码是否正确或使用其他条码';
            errorTitle = '条码重复';
          } else if (errorMsg.includes('medicines_name_key')) {
            errorMessage = '该药品名称已存在，请使用不同的药品名称';
            errorTitle = '药品名称重复';
          } else {
            errorMessage = '该药品信息已存在，请检查输入的信息是否重复';
            errorTitle = '信息重复';
          }
        } else if (errorCode === '23503') {
          // 外键约束违反错误
          errorMessage = '关联的数据不存在，请检查输入信息';
          errorTitle = '数据关联错误';
        } else if (errorCode === '23514') {
          // 检查约束违反错误
          errorMessage = '输入的数据不符合要求，请检查数据格式';
          errorTitle = '数据格式错误';
        }
      }

      handleQueryError(errorTitle, errorMessage);
    },
  });
};

// 更新药品 hook
export const useUpdateMedicine = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (input: UpdateMedicineInput) =>
      medicineService.updateMedicine(input, user?.id),
    onSuccess: data => {
      // 更新缓存中的药品数据
      queryClient.setQueryData(queryKeys.medicines.detail(data.id), data);
      // 使药品列表查询无效
      queryClient.invalidateQueries({ queryKey: queryKeys.medicines.lists() });
      handleQuerySuccess('药品更新成功', '更新成功');
    },
    onError: error => {
      console.error('更新药品失败:', error);

      // 处理特定的错误类型
      let errorMessage = '更新药品失败，请稍后重试';
      let errorTitle = '更新失败';

      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as { code: string | number }).code;
        const errorMsg = (error as { message?: string }).message || '';

        if (errorCode === '23505' || errorCode === 23505) {
          // 唯一约束违反错误
          if (errorMsg.includes('medicines_barcode_key')) {
            errorMessage = '该条码已被其他药品使用，请使用不同的条码';
            errorTitle = '条码重复';
          } else if (errorMsg.includes('medicines_name_key')) {
            errorMessage = '该药品名称已被其他药品使用，请使用不同的名称';
            errorTitle = '药品名称重复';
          } else {
            errorMessage = '该药品信息与其他药品重复，请检查输入的信息';
            errorTitle = '信息重复';
          }
        } else if (errorCode === '23503') {
          errorMessage = '关联的数据不存在，请检查输入信息';
          errorTitle = '数据关联错误';
        } else if (errorCode === '23514') {
          errorMessage = '输入的数据不符合要求，请检查数据格式';
          errorTitle = '数据格式错误';
        }
      }

      handleQueryError(errorTitle, errorMessage);
    },
  });
};

// 删除药品 hook
export const useDeleteMedicine = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (id: string) => medicineService.deleteMedicine(id, user?.id),
    onSuccess: (_, deletedId) => {
      // 从缓存中移除药品数据
      queryClient.removeQueries({
        queryKey: queryKeys.medicines.detail(deletedId),
      });
      // 使药品列表查询无效
      queryClient.invalidateQueries({ queryKey: queryKeys.medicines.lists() });
      handleQuerySuccess('药品删除成功', '删除成功');
    },
    onError: error => {
      console.error('删除药品失败:', error);

      // 处理特定的错误类型
      let errorMessage = '删除药品失败，请稍后重试';
      let errorTitle = '删除失败';

      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as { code: string | number }).code;

        if (errorCode === '23503') {
          // 外键约束违反错误 - 通常表示有关联数据
          errorMessage =
            '该药品存在关联的库存或批次记录，无法删除。请先处理相关记录。';
          errorTitle = '无法删除';
        } else if (errorCode === '42501') {
          // 权限不足
          errorMessage = '您没有权限删除该药品';
          errorTitle = '权限不足';
        }
      }

      handleQueryError(errorTitle, errorMessage);
    },
  });
};

// 预取药品数据 hook
export const usePrefetchMedicine = () => {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.medicines.detail(id),
      queryFn: () => medicineService.getMedicine(id),
      staleTime: 10 * 60 * 1000, // 10分钟
    });
  };
};

// 药品数据工具 hooks
export const useMedicineUtils = () => {
  const queryClient = useQueryClient();

  return {
    // 刷新药品列表
    refreshMedicines: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.medicines.lists() });
    },

    // 刷新单个药品
    refreshMedicine: (id: string) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.medicines.detail(id),
      });
    },

    // 清除药品缓存
    clearMedicineCache: () => {
      queryClient.removeQueries({ queryKey: queryKeys.medicines.all() });
    },

    // 预取药品列表
    prefetchMedicines: (params?: GetMedicinesParams) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.medicines.list(params as Record<string, unknown>),
        queryFn: () => medicineService.getMedicines(params),
        staleTime: 5 * 60 * 1000, // 5分钟
      });
    },
  };
};
