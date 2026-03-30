/**
 * 权限同步 Hook
 * 提供动态权限更新和同步功能
 */

import type { RealtimeChannel } from '@supabase/supabase-js';
import React from 'react';

import { TABLES } from '@/lib/db-keys';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';
import type { AuthUser, UserRole } from '@/types/auth';
import { permissionCacheManager } from '@/utils/auth-utils';

interface PermissionSyncOptions {
  // 自动同步间隔（毫秒）
  syncInterval?: number;
  // 是否启用实时同步
  enableRealtime?: boolean;
  // 权限变更回调
  onPermissionChange?: (user: AuthUser, oldRole?: UserRole) => void;
}

/**
 * 权限同步 Hook
 */
export function usePermissionSync(options: PermissionSyncOptions = {}) {
  const {
    syncInterval = 30000, // 默认30秒
    enableRealtime = true,
    onPermissionChange,
  } = options;

  const { user } = useAuthStore();
  // 注意：使用旧认证系统
  const [isSync, setIsSync] = React.useState(false);
  const [lastSyncTime, setLastSyncTime] = React.useState<Date | null>(null);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const realtimeChannelRef = React.useRef<RealtimeChannel | null>(null);

  /**
   * 手动同步权限
   */
  const syncPermissions = React.useCallback(async () => {
    if (!user?.id) return;

    setIsSync(true);
    try {
      // 获取最新的用户信息
      const { data: userData, error } = await supabase
        .from(TABLES.users)
        .select('id, role, name, email')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('同步权限失败:', error);
        return;
      }

      // 检查角色是否发生变化
      const oldRole = user.role;
      const newRole = userData.role as UserRole;

      if (oldRole !== newRole) {
        // 清除旧的权限缓存
        permissionCacheManager.invalidateUser(user.id);

        // 触发权限变更回调
        if (onPermissionChange) {
          onPermissionChange({ ...user, role: newRole }, oldRole);
        }

        // 注意：新认证系统会自动更新用户信息
      }

      setLastSyncTime(new Date());
    } catch (error) {
      console.error('权限同步过程中发生错误:', error);
    } finally {
      setIsSync(false);
    }
  }, [user, onPermissionChange]);

  /**
   * 启动定时同步
   */
  const startPeriodicSync = React.useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(syncPermissions, syncInterval);
  }, [syncPermissions, syncInterval]);

  /**
   * 停止定时同步
   */
  const stopPeriodicSync = React.useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * 启动实时同步
   */
  const startRealtimeSync = React.useCallback(() => {
    if (!user?.id || !enableRealtime) return;

    // 清理现有的实时连接
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    // 创建新的实时连接
    realtimeChannelRef.current = supabase
      .channel(`user_permissions_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: TABLES.users,
          filter: `id=eq.${user.id}`,
        },
        payload => {
          console.log('检测到用户权限变更:', payload);
          syncPermissions();
        }
      )
      .subscribe();
  }, [user?.id, enableRealtime, syncPermissions]);

  /**
   * 停止实时同步
   */
  const stopRealtimeSync = React.useCallback(() => {
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
  }, []);

  /**
   * 强制刷新权限缓存
   */
  const invalidatePermissionCache = React.useCallback(() => {
    if (user?.id) {
      permissionCacheManager.invalidateUser(user.id);
    }
  }, [user?.id]);

  // 组件挂载时启动同步
  React.useEffect(() => {
    if (user?.id) {
      startPeriodicSync();
      startRealtimeSync();
    }

    return () => {
      stopPeriodicSync();
      stopRealtimeSync();
    };
  }, [
    user?.id,
    startPeriodicSync,
    startRealtimeSync,
    stopPeriodicSync,
    stopRealtimeSync,
  ]);

  // 用户变更时重新启动同步
  React.useEffect(() => {
    if (user?.id) {
      startRealtimeSync();
    }
  }, [user?.id, user, startRealtimeSync]);

  return {
    // 状态
    isSync,
    lastSyncTime,

    // 操作
    syncPermissions,
    startPeriodicSync,
    stopPeriodicSync,
    startRealtimeSync,
    stopRealtimeSync,
    invalidatePermissionCache,

    // 配置
    syncInterval,
    enableRealtime,
  };
}

/**
 * 权限变更监听 Hook
 */
export function usePermissionChangeListener(
  callback: (user: AuthUser, oldRole?: UserRole) => void
) {
  const { user } = useAuthStore();
  const previousRoleRef = React.useRef<UserRole | undefined>(user?.role);

  React.useEffect(() => {
    const currentRole = user?.role;
    const previousRole = previousRoleRef.current;

    if (user && currentRole !== previousRole) {
      callback(user, previousRole);
      previousRoleRef.current = currentRole;
    }
  }, [user, user?.role, callback]);
}

/**
 * 权限缓存状态 Hook
 */
export function usePermissionCacheStats() {
  const [stats, setStats] = React.useState(permissionCacheManager.getStats());

  React.useEffect(() => {
    const updateStats = () => {
      setStats(permissionCacheManager.getStats());
    };

    // 定期更新统计信息
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, []);

  return stats;
}
