import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { batchService } from './use-batches';
import { medicineService } from './use-medicines';

import { handleQueryError, handleQuerySuccess } from '@/lib/query-client';

// 检查药品依赖关系的 hook
export const useMedicineDependencies = (
  medicineId: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['medicine-dependencies', medicineId],
    queryFn: () => medicineService.checkMedicineDependencies(medicineId),
    enabled: enabled && !!medicineId,
    staleTime: 0, // 总是获取最新数据
    gcTime: 0, // 不缓存
  });
};

// 检查批次依赖关系的 hook
export const useBatchDependencies = (
  batchId: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['batch-dependencies', batchId],
    queryFn: () => batchService.checkBatchDependencies(batchId),
    enabled: enabled && !!batchId,
    staleTime: 0, // 总是获取最新数据
    gcTime: 0, // 不缓存
  });
};

// 级联删除药品的 hook
export const useCascadeDeleteMedicine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      confirmDelete,
    }: {
      id: string;
      confirmDelete: boolean;
    }) => medicineService.safeDeleteMedicine(id, confirmDelete),
    onSuccess: (result, { id }) => {
      if (result.success) {
        // 从缓存中移除药品数据
        queryClient.removeQueries({
          queryKey: ['medicines', 'detail', id],
        });
        // 使药品列表查询无效
        queryClient.invalidateQueries({ queryKey: ['medicines'] });
        // 使批次相关查询无效
        queryClient.invalidateQueries({ queryKey: ['batches'] });
        // 使库存相关查询无效
        queryClient.invalidateQueries({ queryKey: ['inventory'] });

        const message =
          result.deleted_transactions || result.deleted_batches
            ? `药品删除成功，同时删除了 ${result.deleted_transactions || 0} 条交易记录和 ${result.deleted_batches || 0} 个批次`
            : '药品删除成功';

        handleQuerySuccess('删除成功', message);
      } else if (result.warning) {
        // 这种情况不应该发生，因为我们传递了 confirmDelete: true
        handleQueryError('删除失败', result.message || '删除操作被取消');
      }
    },
    onError: error => {
      console.error('级联删除药品失败:', error);
      handleQueryError('删除失败', '删除药品时发生错误，请稍后重试');
    },
  });
};

// 级联删除批次的 hook
export const useCascadeDeleteBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      confirmDelete,
    }: {
      id: string;
      confirmDelete: boolean;
    }) => batchService.safeDeleteBatch(id, confirmDelete),
    onSuccess: (result, { id }) => {
      if (result.success) {
        // 从缓存中移除批次数据
        queryClient.removeQueries({
          queryKey: ['batches', 'detail', id],
        });
        // 使批次列表查询无效
        queryClient.invalidateQueries({ queryKey: ['batches'] });
        // 使库存相关查询无效
        queryClient.invalidateQueries({ queryKey: ['inventory'] });

        const message = result.deleted_transactions
          ? `批次删除成功，同时删除了 ${result.deleted_transactions} 条交易记录`
          : '批次删除成功';

        handleQuerySuccess('删除成功', message);
      } else if (result.warning) {
        // 这种情况不应该发生，因为我们传递了 confirmDelete: true
        handleQueryError('删除失败', result.message || '删除操作被取消');
      }
    },
    onError: error => {
      console.error('级联删除批次失败:', error);
      handleQueryError('删除失败', '删除批次时发生错误，请稍后重试');
    },
  });
};

// 预检查删除操作的 hook
export const usePreCheckDelete = () => {
  return {
    // 预检查药品删除
    checkMedicineDelete: async (medicineId: string) => {
      try {
        const result = await medicineService.safeDeleteMedicine(
          medicineId,
          false
        );
        return {
          canDelete: result.success,
          needsConfirmation: result.warning || false,
          dependencies: {
            transaction_count: result.transaction_count,
            batch_count: result.batch_count,
            medicine_name: result.medicine_name,
          },
          message: result.message,
        };
      } catch (error) {
        console.error('预检查药品删除失败:', error);
        return {
          canDelete: false,
          needsConfirmation: false,
          dependencies: {},
          message: '检查删除条件时发生错误',
        };
      }
    },

    // 预检查批次删除
    checkBatchDelete: async (batchId: string) => {
      try {
        const result = await batchService.safeDeleteBatch(batchId, false);
        return {
          canDelete: result.success,
          needsConfirmation: result.warning || false,
          dependencies: {
            transaction_count: result.transaction_count,
            medicine_name: result.medicine_name,
            batch_number: result.batch_number,
          },
          message: result.message,
        };
      } catch (error) {
        console.error('预检查批次删除失败:', error);
        return {
          canDelete: false,
          needsConfirmation: false,
          dependencies: {},
          message: '检查删除条件时发生错误',
        };
      }
    },
  };
};
