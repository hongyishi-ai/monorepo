/**
 * 权限门控组件
 * 用于在组件级别进行权限检查
 */

import React from 'react';

// 使用旧认证系统
import { useAuthStore } from '@/stores/auth.store';
import type { UserRole } from '@/types/auth';
import { hasPermission, hasRole } from '@/utils/auth-utils';

interface PermissionGateProps {
  children: React.ReactNode;
  // 具体权限检查
  permission?: string;
  // 角色权限检查
  role?: UserRole;
  // 自定义权限检查函数
  check?: (user: unknown) => boolean;
  // 无权限时的回退组件
  fallback?: React.ReactNode;
  // 是否显示无权限提示
  showFallback?: boolean;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permission,
  role,
  check,
  fallback,
  showFallback = false,
}) => {
  // 使用旧认证系统获取认证状态
  const { user } = useAuthStore();

  // 执行权限检查
  const hasAccess = React.useMemo(() => {
    if (!user) return false;

    // 自定义检查函数优先级最高
    if (check) {
      return check(user);
    }

    // 具体权限检查
    if (permission) {
      return hasPermission(user, permission);
    }

    // 角色权限检查
    if (role) {
      return hasRole(user, role);
    }

    // 默认允许访问
    return true;
  }, [user, permission, role, check]);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (showFallback && fallback) {
    return <>{fallback}</>;
  }

  return null;
};

// 权限检查工具函数已移至 permission-utils.ts
