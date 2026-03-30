/**
 * 撤回交易相关的 React Query hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { UndoTransactionService } from '@/services/undo-transaction.service';
import { useAuthStore } from '@/stores/auth.store';
import { useNotificationStore } from '@/stores/notification.store';

/**
 * 获取可撤回的交易列表
 */
export const useUndoableTransactions = (userId?: string) => {
  return useQuery({
    queryKey: ['undoable-transactions', userId],
    queryFn: () => UndoTransactionService.getUndoableTransactions(userId),
    staleTime: 30 * 1000, // 30秒
    gcTime: 2 * 60 * 1000, // 2分钟
    refetchInterval: 60 * 1000, // 每分钟刷新一次，更新剩余时间
  });
};

/**
 * 获取当前用户的可撤回交易
 */
export const useMyUndoableTransactions = () => {
  const { user } = useAuthStore();
  return useUndoableTransactions(user?.id);
};

/**
 * 撤回出库交易
 */
export const useUndoOutboundTransaction = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationStore();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (undoableTransactionId: string) => {
      if (!user?.id) {
        throw new Error('用户未登录');
      }
      return UndoTransactionService.undoOutboundTransaction(
        undoableTransactionId,
        user.id
      );
    },
    onSuccess: result => {
      if (result.success) {
        addNotification({
          type: 'success',
          title: '撤回成功',
          message: `成功撤回出库操作：${result.medicine_name} (批次: ${result.batch_number}, 数量: ${result.quantity})`,
          priority: 'medium',
        });

        // 刷新相关查询
        queryClient.invalidateQueries({ queryKey: ['undoable-transactions'] });
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        queryClient.invalidateQueries({ queryKey: ['batches'] });
        queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      } else {
        addNotification({
          type: 'error',
          title: '撤回失败',
          message: result.error || '撤回操作失败',
          priority: 'high',
        });
      }
    },
    onError: error => {
      addNotification({
        type: 'error',
        title: '撤回失败',
        message: `撤回操作失败: ${error.message}`,
        priority: 'high',
      });
    },
  });
};

/**
 * 检查交易是否可以撤回
 */
export const useCanUndoTransaction = (transactionId: string) => {
  return useQuery({
    queryKey: ['can-undo-transaction', transactionId],
    queryFn: () => UndoTransactionService.canUndoTransaction(transactionId),
    enabled: !!transactionId,
    staleTime: 30 * 1000, // 30秒
  });
};

/**
 * 获取撤回统计信息
 */
export const useUndoStats = (userId?: string) => {
  return useQuery({
    queryKey: ['undo-stats', userId],
    queryFn: () => UndoTransactionService.getUndoStats(userId),
    staleTime: 60 * 1000, // 1分钟
    refetchInterval: 60 * 1000, // 每分钟刷新
  });
};

/**
 * 获取当前用户的撤回统计信息
 */
export const useMyUndoStats = () => {
  const { user } = useAuthStore();
  return useUndoStats(user?.id);
};

/**
 * 清理过期的可撤回交易
 */
export const useCleanupExpiredTransactions = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationStore();

  return useMutation({
    mutationFn: () => UndoTransactionService.cleanupExpiredTransactions(),
    onSuccess: deletedCount => {
      if (deletedCount > 0) {
        addNotification({
          type: 'success',
          title: '清理完成',
          message: `清理了 ${deletedCount} 条过期的可撤回交易`,
          priority: 'low',
        });

        // 刷新相关查询
        queryClient.invalidateQueries({ queryKey: ['undoable-transactions'] });
        queryClient.invalidateQueries({ queryKey: ['undo-stats'] });
      }
    },
    onError: error => {
      addNotification({
        type: 'error',
        title: '清理失败',
        message: `清理过期交易失败: ${error.message}`,
        priority: 'medium',
      });
    },
  });
};

/**
 * 格式化剩余时间的 hook
 */
export const useFormatTimeRemaining = () => {
  return UndoTransactionService.formatTimeRemaining;
};

/**
 * 获取撤回状态颜色的 hook
 */
export const useUndoStatusColor = () => {
  return UndoTransactionService.getUndoStatusColor;
};
