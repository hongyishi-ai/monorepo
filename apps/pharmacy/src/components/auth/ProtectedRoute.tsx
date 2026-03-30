/**
 * 受保护路由组件
 * 用于保护需要认证的页面
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// 使用旧认证系统
import { useAuthStore } from '@/stores/auth.store';
import type { UserRole } from '@/types/auth';
import { hasPermission, hasRole } from '@/utils/auth-utils';

interface ProtectedRouteProps {
  children: React.ReactNode;
  // 角色权限检查
  requiredRole?: UserRole;
  // 具体权限检查
  requiredPermission?: string;
  // 自定义权限检查函数
  permissionCheck?: (user: unknown) => boolean;
  // 无权限时的回退组件
  fallback?: React.ReactNode;
  // 重定向路径
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  permissionCheck,
  fallback,
  redirectTo,
}: ProtectedRouteProps) {
  // 使用旧认证系统获取认证状态
  const { isAuthenticated, user, isInitializing, isProfileLoading } =
    useAuthStore();
  const location = useLocation();

  // 权限检查逻辑
  const hasAccess = React.useMemo(() => {
    if (!user) return false;

    // 如果用户角色信息还在加载中，暂时拒绝访问（会显示加载状态）
    if (user.role === undefined) return false;

    // 自定义权限检查函数优先级最高
    if (permissionCheck) {
      return permissionCheck(user);
    }

    // 具体权限检查
    if (requiredPermission) {
      return hasPermission(user, requiredPermission);
    }

    // 角色权限检查
    if (requiredRole) {
      return hasRole(user, requiredRole);
    }

    // 默认允许访问（已认证用户）
    return true;
  }, [user, requiredRole, requiredPermission, permissionCheck]);

  // 开发环境调试信息
  if (import.meta.env.DEV) {
    console.log('🛡️ ProtectedRoute 检查:', {
      isAuthenticated,
      user: user?.email,
      requiredRole,
      requiredPermission,
      hasAccess,
      isInitializing,
      isProfileLoading,
    });
  }

  // 如果正在初始化或权限信息正在加载，显示加载状态
  if (isInitializing || isProfileLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-2 text-sm text-gray-600'>
            {isInitializing ? '正在初始化...' : '正在加载用户权限...'}
          </p>
          {/* 开发环境显示调试信息 */}
          {import.meta.env.DEV && (
            <p className='mt-1 text-xs text-gray-500'>🛠️ 使用适配器认证系统</p>
          )}
        </div>
      </div>
    );
  }

  // 如果未认证，重定向到登录页面
  if (!isAuthenticated) {
    return <Navigate to='/login' state={{ from: location }} replace />;
  }

  // 如果没有权限
  if (!hasAccess) {
    // 如果指定了重定向路径
    if (redirectTo) {
      return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    // 显示无权限页面或回退组件
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center max-w-md'>
          <div className='mb-4'>
            <div className='mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center'>
              <svg
                className='w-8 h-8 text-red-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
            </div>
          </div>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>访问被拒绝</h1>
          <p className='text-gray-600 mb-6'>
            您没有权限访问此页面。请联系管理员获取相应权限。
          </p>
          <button
            onClick={() => window.history.back()}
            className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          >
            返回上一页
          </button>
        </div>
      </div>
    );
  }

  // 认证通过，渲染子组件
  return <>{children}</>;
}
