/**
 * 审计日志服务
 * 处理审计日志的查询和管理
 */

import { TABLES } from '@/lib/db-keys';
import { supabase } from '@/lib/supabase';
import type { AuditLog } from '@/types/database';

export interface AuditLogFilters {
  userId?: string;
  actionType?: string;
  tableName?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditLogResponse {
  data: AuditLogWithUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuditLogWithUser extends AuditLog {
  user_name: string;
  user_email: string;
  user_role: string;
  target_name?: string;
  target_type?: string;
  description?: string;
}

export class AuditLogsService {
  /**
   * 获取审计日志列表
   */
  static async getAuditLogs(
    filters: AuditLogFilters = {}
  ): Promise<AuditLogResponse> {
    const {
      userId,
      actionType,
      tableName,
      startDate,
      endDate,
      page = 1,
      pageSize = 20,
    } = filters;

    let query = supabase
      .from(TABLES.auditLogs)
      .select(
        `
        *,
        users!audit_logs_user_id_fkey (
          name,
          email
        )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false });

    // 应用过滤条件
    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (actionType) {
      query = query.eq('action_type', actionType);
    }

    if (tableName) {
      query = query.eq('table_name', tableName);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // 分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`获取审计日志失败: ${error.message}`);
    }

    // 转换数据格式
    const auditLogs: AuditLogWithUser[] = (data || []).map(item => ({
      ...item,
      user_name: item.users?.name || '未知用户',
      user_email: item.users?.email || '',
    }));

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      data: auditLogs,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  /**
   * 获取审计日志统计信息
   */
  static async getAuditLogStats(): Promise<{
    totalLogs: number;
    todayLogs: number;
    actionTypeStats: Array<{ action_type: string; count: number }>;
    userStats: Array<{ user_name: string; count: number }>;
  }> {
    const today = new Date().toISOString().split('T')[0];

    // 获取总数
    const { count: totalLogs } = await supabase
      .from(TABLES.auditLogs)
      .select('*', { count: 'exact', head: true });

    // 获取今日日志数
    const { count: todayLogs } = await supabase
      .from(TABLES.auditLogs)
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today);

    // 获取操作类型统计
    const { data: actionTypeData } = await supabase
      .from(TABLES.auditLogs)
      .select('action_type')
      .gte(
        'created_at',
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      );

    const actionTypeStats =
      actionTypeData?.reduce(
        (acc, item) => {
          const existing = acc.find(
            stat => stat.action_type === item.action_type
          );
          if (existing) {
            existing.count++;
          } else {
            acc.push({ action_type: item.action_type, count: 1 });
          }
          return acc;
        },
        [] as Array<{ action_type: string; count: number }>
      ) || [];

    // 获取用户操作统计
    const { data: userStatsData } = await supabase
      .from(TABLES.auditLogs)
      .select(
        `
        user_id,
        users!audit_logs_user_id_fkey (name)
      `
      )
      .gte(
        'created_at',
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      );

    const userStats =
      userStatsData?.reduce(
        (acc, item) => {
          const userName =
            (item.users as { name?: string })?.name || '未知用户';
          const existing = acc.find(stat => stat.user_name === userName);
          if (existing) {
            existing.count++;
          } else {
            acc.push({ user_name: userName, count: 1 });
          }
          return acc;
        },
        [] as Array<{ user_name: string; count: number }>
      ) || [];

    return {
      totalLogs: totalLogs || 0,
      todayLogs: todayLogs || 0,
      actionTypeStats: actionTypeStats
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      userStats: userStats.sort((a, b) => b.count - a.count).slice(0, 10),
    };
  }

  /**
   * 获取特定记录的审计历史
   */
  static async getRecordAuditHistory(
    tableName: string,
    recordId: string
  ): Promise<AuditLogWithUser[]> {
    const { data, error } = await supabase
      .from(TABLES.auditLogs)
      .select(
        `
        *,
        users!audit_logs_user_id_fkey (
          name,
          email
        )
      `
      )
      .eq('table_name', tableName)
      .eq('record_id', recordId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`获取记录审计历史失败: ${error.message}`);
    }

    return (data || []).map(item => ({
      ...item,
      user_name: item.users?.name || '未知用户',
      user_email: item.users?.email || '',
    }));
  }

  /**
   * 导出审计日志
   */
  static async exportAuditLogs(
    filters: AuditLogFilters = {}
  ): Promise<AuditLogWithUser[]> {
    const { userId, actionType, tableName, startDate, endDate } = filters;

    let query = supabase
      .from(TABLES.auditLogs)
      .select(
        `
        *,
        users!audit_logs_user_id_fkey (
          name,
          email
        )
      `
      )
      .order('created_at', { ascending: false });

    // 应用过滤条件
    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (actionType) {
      query = query.eq('action_type', actionType);
    }

    if (tableName) {
      query = query.eq('table_name', tableName);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`导出审计日志失败: ${error.message}`);
    }

    return (data || []).map(item => ({
      ...item,
      user_name: item.users?.name || '未知用户',
      user_email: item.users?.email || '',
    }));
  }

  /**
   * 获取操作类型选项
   */
  static getActionTypeOptions(): Array<{ value: string; label: string }> {
    return [
      { value: 'create_medicine', label: '创建药品' },
      { value: 'update_medicine', label: '更新药品' },
      { value: 'delete_medicine', label: '删除药品' },
      { value: 'create_batch', label: '创建批次' },
      { value: 'update_batch', label: '更新批次' },
      { value: 'delete_batch', label: '删除批次' },
      { value: 'inbound_transaction', label: '入库操作' },
      { value: 'outbound_transaction', label: '出库操作' },
      { value: 'undo_transaction', label: '撤回操作' },
    ];
  }

  /**
   * 获取表名选项
   */
  static getTableNameOptions(): Array<{ value: string; label: string }> {
    return [
      { value: 'medicines', label: '药品表' },
      { value: 'batches', label: '批次表' },
      { value: 'inventory_transactions', label: '库存交易表' },
    ];
  }

  /**
   * 格式化操作类型显示文本
   */
  static formatActionType(actionType: string): string {
    const options = this.getActionTypeOptions();
    const option = options.find(opt => opt.value === actionType);
    return option?.label || actionType;
  }

  /**
   * 格式化表名显示文本
   */
  static formatTableName(tableName: string): string {
    const options = this.getTableNameOptions();
    const option = options.find(opt => opt.value === tableName);
    return option?.label || tableName;
  }
}
