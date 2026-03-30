/**
 * 撤回交易服务
 * 处理出库操作的撤回功能
 */

import { RPC, TABLES } from '@/lib/db-keys';
import { supabase } from '@/lib/supabase';
import type { UndoableTransactionWithDetails } from '@/types/database';

export interface UndoTransactionResult {
  success: boolean;
  error?: string;
  new_transaction_id?: string;
  medicine_name?: string;
  batch_number?: string;
  quantity?: number;
}

export class UndoTransactionService {
  /**
   * 获取可撤回的交易列表
   */
  static async getUndoableTransactions(
    userId?: string
  ): Promise<UndoableTransactionWithDetails[]> {
    const { data, error } = await supabase.rpc(RPC.getUndoableTransactions, {
      p_user_id: userId || null,
    });

    if (error) {
      throw new Error(`获取可撤回交易失败: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 撤回出库交易
   */
  static async undoOutboundTransaction(
    undoableTransactionId: string,
    userId: string
  ): Promise<UndoTransactionResult> {
    // 先通过撤回记录ID查询原始出库交易ID
    const { data: undoable, error: fetchError } = await supabase
      .from(TABLES.undoableTransactions)
      .select('transaction_id')
      .eq('id', undoableTransactionId)
      .single();

    if (fetchError || !undoable?.transaction_id) {
      throw new Error(
        `无法获取原始交易ID：${fetchError?.message || '记录不存在'}`
      );
    }

    // 使用原始出库交易ID调用撤回RPC
    const { data, error } = await supabase.rpc(RPC.undoOutboundTransaction, {
      p_transaction_id: undoable.transaction_id,
      p_user_id: userId,
    });

    if (error) {
      throw new Error(`撤回交易失败: ${error.message}`);
    }

    return data as UndoTransactionResult;
  }

  /**
   * 检查交易是否可以撤回
   */
  static async canUndoTransaction(transactionId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from(TABLES.undoableTransactions)
      .select('id')
      .eq('transaction_id', transactionId)
      .eq('is_undone', false)
      .gt('undo_deadline', new Date().toISOString())
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`检查撤回权限失败: ${error.message}`);
    }

    return !!data;
  }

  /**
   * 获取用户的撤回统计信息
   */
  static async getUndoStats(userId?: string): Promise<{
    totalUndoable: number;
    expiringSoon: number;
    undoneToday: number;
  }> {
    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).toISOString();
    const soonThreshold = new Date(
      now.getTime() + 2 * 60 * 60 * 1000
    ).toISOString(); // 2小时内过期

    // 获取可撤回交易总数
    let totalQuery = supabase
      .from(TABLES.undoableTransactions)
      .select('*', { count: 'exact', head: true })
      .eq('is_undone', false)
      .gt('undo_deadline', now.toISOString());

    if (userId) {
      totalQuery = totalQuery.eq('user_id', userId);
    }

    const { count: totalUndoable } = await totalQuery;

    // 获取即将过期的交易数
    let expiringSoonQuery = supabase
      .from(TABLES.undoableTransactions)
      .select('*', { count: 'exact', head: true })
      .eq('is_undone', false)
      .gt('undo_deadline', now.toISOString())
      .lt('undo_deadline', soonThreshold);

    if (userId) {
      expiringSoonQuery = expiringSoonQuery.eq('user_id', userId);
    }

    const { count: expiringSoon } = await expiringSoonQuery;

    // 获取今日已撤回交易数
    let undoneQuery = supabase
      .from(TABLES.undoableTransactions)
      .select('*', { count: 'exact', head: true })
      .eq('is_undone', true)
      .gte('undone_at', today);

    if (userId) {
      undoneQuery = undoneQuery.eq('undone_by', userId);
    }

    const { count: undoneToday } = await undoneQuery;

    return {
      totalUndoable: totalUndoable || 0,
      expiringSoon: expiringSoon || 0,
      undoneToday: undoneToday || 0,
    };
  }

  /**
   * 格式化剩余时间
   */
  static formatTimeRemaining(timeRemaining: string): string {
    const interval = timeRemaining.replace(/^PT/, '').replace(/S$/, '');

    // 解析 PostgreSQL interval 格式
    const match = interval.match(/(-?)(\d+):(\d+):(\d+)/);
    if (!match) return '已过期';

    const [, sign, hours, minutes, seconds] = match;
    const totalSeconds =
      parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);

    if (sign === '-' || totalSeconds <= 0) {
      return '已过期';
    }

    if (totalSeconds < 60) {
      return `${totalSeconds}秒`;
    } else if (totalSeconds < 3600) {
      const mins = Math.floor(totalSeconds / 60);
      return `${mins}分钟`;
    } else {
      const hrs = Math.floor(totalSeconds / 3600);
      const mins = Math.floor((totalSeconds % 3600) / 60);
      return mins > 0 ? `${hrs}小时${mins}分钟` : `${hrs}小时`;
    }
  }

  /**
   * 获取撤回状态的颜色
   */
  static getUndoStatusColor(
    timeRemaining: string
  ): 'success' | 'warning' | 'destructive' {
    const interval = timeRemaining.replace(/^PT/, '').replace(/S$/, '');
    const match = interval.match(/(-?)(\d+):(\d+):(\d+)/);

    if (!match) return 'destructive';

    const [, sign, hours, minutes, seconds] = match;
    const totalSeconds =
      parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);

    if (sign === '-' || totalSeconds <= 0) {
      return 'destructive';
    } else if (totalSeconds < 2 * 3600) {
      // 少于2小时
      return 'warning';
    } else {
      return 'success';
    }
  }

  /**
   * 清理过期的可撤回交易
   */
  static async cleanupExpiredTransactions(): Promise<number> {
    const { data, error } = await supabase.rpc(
      RPC.cleanupExpiredUndoableTransactions
    );

    if (error) {
      throw new Error(`清理过期交易失败: ${error.message}`);
    }

    return data || 0;
  }
}
