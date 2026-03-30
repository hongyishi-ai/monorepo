/**
 * 认证相关的辅助函数和Hook
 */

import React from 'react';

import { ProtectedRoute } from './ProtectedRoute';

// 使用旧认证系统
import { useAuthStore } from '@/stores/auth.store';
import type { UserRole } from '@/types/auth';
import { hasRole } from '@/utils/auth-utils';

// 高阶组件版本，用于包装组件
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: UserRole
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute requiredRole={requiredRole}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// 权限检查 Hook
export function useRequireAuth(requiredRole?: UserRole) {
  // 使用旧认证系统获取认证状态
  const { isAuthenticated, user, isInitializing } = useAuthStore();

  React.useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      // 可以在这里添加重定向逻辑
      console.warn('用户未认证，需要登录');
    }

    if (requiredRole && !hasRole(user, requiredRole)) {
      console.warn(`用户权限不足，需要 ${requiredRole} 权限`);
    }
  }, [isAuthenticated, user, requiredRole, isInitializing]);

  return {
    isAuthenticated,
    user,
    isInitializing,
    hasRequiredRole: requiredRole ? hasRole(user, requiredRole) : true,
  };
}
