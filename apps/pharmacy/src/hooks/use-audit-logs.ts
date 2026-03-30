/**
 * 审计日志相关的 React Query hooks
 */

import { useMutation, useQuery } from '@tanstack/react-query';

import {
  AuditLogsService,
  type AuditLogFilters,
} from '@/services/audit-logs.service';
import { useNotificationStore } from '@/stores/notification.store';

// 重新导出类型和工具函数
export type { AuditLogFilters };

// 操作类型标签映射
export const actionTypeLabels: Record<string, string> = {
  create_medicine: '创建药品',
  update_medicine: '更新药品',
  delete_medicine: '删除药品',
  create_batch: '创建批次',
  update_batch: '更新批次',
  delete_batch: '删除批次',
  inbound_transaction: '入库操作',
  outbound_transaction: '出库操作',
  undo_transaction: '撤回操作',
  inventory_inbound: '入库操作',
  inventory_outbound: '出库操作',
};

// 角色标签映射
export const roleLabels: Record<string, string> = {
  admin: '管理员',
  pharmacist: '药师',
  operator: '操作员',
  staff: '员工',
};

// 获取操作类型标签
export const getActionTypeLabel = (actionType: string): string => {
  return actionTypeLabels[actionType] || actionType;
};

// 获取角色标签
export const getRoleLabel = (role: string): string => {
  return roleLabels[role] || role;
};

/**
 * 获取审计日志列表
 */
export const useAuditLogs = (filters: AuditLogFilters = {}) => {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => AuditLogsService.getAuditLogs(filters),
    staleTime: 30 * 1000, // 30秒
    gcTime: 5 * 60 * 1000, // 5分钟
  });
};

/**
 * 获取审计日志统计信息
 */
export const useAuditLogStats = () => {
  return useQuery({
    queryKey: ['audit-logs-stats'],
    queryFn: () => AuditLogsService.getAuditLogStats(),
    staleTime: 60 * 1000, // 1分钟
    gcTime: 5 * 60 * 1000, // 5分钟
  });
};

/**
 * 获取特定记录的审计历史
 */
export const useRecordAuditHistory = (tableName: string, recordId: string) => {
  return useQuery({
    queryKey: ['audit-history', tableName, recordId],
    queryFn: () => AuditLogsService.getRecordAuditHistory(tableName, recordId),
    enabled: !!(tableName && recordId),
    staleTime: 60 * 1000, // 1分钟
  });
};

/**
 * 导出审计日志
 */
export const useExportAuditLogs = () => {
  const { addNotification } = useNotificationStore();

  return useMutation({
    mutationFn: (filters: AuditLogFilters) =>
      AuditLogsService.exportAuditLogs(filters),
    onSuccess: data => {
      // 创建CSV内容
      const headers = [
        '时间',
        '用户',
        '操作类型',
        '表名',
        '记录ID',
        'IP地址',
        '用户代理',
      ];

      const csvContent = [
        headers.join(','),
        ...data.map(log =>
          [
            new Date(log.created_at).toLocaleString('zh-CN'),
            log.user_name,
            AuditLogsService.formatActionType(log.action_type),
            AuditLogsService.formatTableName(log.table_name),
            log.record_id,
            log.ip_address || '',
            log.user_agent || '',
          ]
            .map(field => `"${field}"`)
            .join(',')
        ),
      ].join('\n');

      // 下载文件
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addNotification({
        type: 'success',
        title: '导出成功',
        message: `成功导出 ${data.length} 条审计日志`,
        priority: 'medium',
      });
    },
    onError: error => {
      addNotification({
        type: 'error',
        title: '导出失败',
        message: `导出失败: ${error.message}`,
        priority: 'high',
      });
    },
  });
};

/**
 * 获取操作类型选项
 */
export const useActionTypeOptions = () => {
  return AuditLogsService.getActionTypeOptions();
};

/**
 * 获取表名选项
 */
export const useTableNameOptions = () => {
  return AuditLogsService.getTableNameOptions();
};
