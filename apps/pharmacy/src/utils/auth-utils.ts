/**
 * 认证工具函数
 * 提供权限检查、角色管理等功能
 */

import React from 'react';

import type { AuthUser, PasswordPolicy, UserRole } from '../types/auth';

// 角色权限映射
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    'user:create',
    'user:read',
    'user:update',
    'user:delete',
    'medicine:create',
    'medicine:read',
    'medicine:update',
    'medicine:delete',
    'inventory:create',
    'inventory:read',
    'inventory:update',
    'inventory:delete',
    'report:read',
    'report:export',
    'system:config',
    'system:backup',
  ],
  manager: [
    'medicine:create',
    'medicine:read',
    'medicine:update',
    'inventory:create',
    'inventory:read',
    'inventory:update',
    'report:read',
    'report:export',
  ],
  operator: [
    'medicine:read',
    'inventory:create',
    'inventory:read',
    'inventory:update',
  ],
};

// 角色层级
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 3,
  manager: 2,
  operator: 1,
};

// 角色显示名称
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: '系统管理员',
  manager: '库存经理',
  operator: '操作员',
};

// 角色描述
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: '拥有系统所有权限，可以管理用户、配置系统',
  manager: '可以管理药品信息、查看报表、导入导出数据',
  operator: '可以进行基本的入库出库操作',
};

/**
 * 检查用户是否有指定权限
 */
export function hasPermission(
  user: AuthUser | null,
  permission: string
): boolean {
  if (!user?.role) return false;

  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission);
}

/**
 * 检查用户角色是否满足要求
 */
export function hasRole(
  user: AuthUser | null,
  requiredRole: UserRole
): boolean {
  if (!user?.role) return false;

  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * 检查用户是否可以管理指定角色的用户
 */
export function canManageRole(
  managerRole: UserRole,
  targetRole: UserRole
): boolean {
  return ROLE_HIERARCHY[managerRole] > ROLE_HIERARCHY[targetRole];
}

/**
 * 获取用户可以管理的角色列表
 */
export function getManageableRoles(userRole: UserRole): UserRole[] {
  const userLevel = ROLE_HIERARCHY[userRole];
  return Object.entries(ROLE_HIERARCHY)
    .filter(([, level]) => level < userLevel)
    .map(([role]) => role as UserRole);
}

/**
 * 获取所有角色选项
 */
export function getAllRoles(): Array<{
  value: UserRole;
  label: string;
  description: string;
}> {
  return Object.entries(ROLE_LABELS).map(([value, label]) => ({
    value: value as UserRole,
    label,
    description: ROLE_DESCRIPTIONS[value as UserRole],
  }));
}

/**
 * 验证邮箱格式
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 默认密码策略
 */
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
};

/**
 * 验证密码强度
 */
export function validatePassword(
  password: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < policy.minLength) {
    errors.push(`密码长度至少需要 ${policy.minLength} 位`);
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('密码必须包含至少一个大写字母');
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('密码必须包含至少一个小写字母');
  }

  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push('密码必须包含至少一个数字');
  }

  if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('密码必须包含至少一个特殊字符');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 生成随机密码
 */
export function generateRandomPassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';

  const allChars = uppercase + lowercase + numbers + special;
  let password = '';

  // 确保包含每种类型的字符
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // 填充剩余长度
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // 打乱字符顺序
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * 格式化用户显示名称
 */
export function formatUserDisplayName(user: AuthUser): string {
  if (user.profile?.name) {
    return user.profile.name;
  }

  if (user.user_metadata?.name) {
    return user.user_metadata.name;
  }

  return user.email || '未知用户';
}

/**
 * 获取用户角色显示名称
 */
export function getUserRoleLabel(role?: UserRole): string {
  if (!role) return '未知角色';
  return ROLE_LABELS[role] || role;
}

/**
 * 检查会话是否即将过期
 */
export function isSessionExpiringSoon(
  expiresAt?: number,
  thresholdMinutes: number = 5
): boolean {
  if (!expiresAt) return false;

  const now = Math.floor(Date.now() / 1000);
  const threshold = thresholdMinutes * 60;

  return expiresAt - now <= threshold;
}

/**
 * 格式化会话剩余时间
 */
export function formatSessionTimeRemaining(expiresAt?: number): string {
  if (!expiresAt) return '未知';

  const now = Math.floor(Date.now() / 1000);
  const remaining = expiresAt - now;

  if (remaining <= 0) return '已过期';

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);

  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  } else {
    return `${minutes}分钟`;
  }
}

/**
 * 创建权限检查 Hook
 */
export function createPermissionChecker(user: AuthUser | null) {
  return {
    hasPermission: (permission: string) => hasPermission(user, permission),
    hasRole: (role: UserRole) => hasRole(user, role),
    canManage: (targetRole: UserRole) =>
      user?.role ? canManageRole(user.role, targetRole) : false,
  };
}

/**
 * 增强的权限缓存 Hook
 */
export function usePermissionCache(user: AuthUser | null) {
  return React.useMemo(() => {
    if (!user?.role) return new Set<string>();

    const permissions = ROLE_PERMISSIONS[user.role] || [];
    return new Set(permissions);
  }, [user?.role]);
}

/**
 * 权限缓存管理器
 */
class PermissionCacheManager {
  private cache = new Map<string, Set<string>>();
  private lastUpdate = new Map<string, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

  /**
   * 获取用户权限缓存
   */
  getPermissions(userId: string, role: UserRole): Set<string> {
    const cacheKey = `${userId}_${role}`;
    const now = Date.now();

    // 检查缓存是否过期
    const lastUpdateTime = this.lastUpdate.get(cacheKey) || 0;
    if (now - lastUpdateTime > this.CACHE_TTL) {
      this.invalidateUser(userId);
    }

    // 如果缓存不存在，创建新的
    if (!this.cache.has(cacheKey)) {
      const permissions = ROLE_PERMISSIONS[role] || [];
      this.cache.set(cacheKey, new Set(permissions));
      this.lastUpdate.set(cacheKey, now);
    }

    return this.cache.get(cacheKey) || new Set();
  }

  /**
   * 使用户缓存失效
   */
  invalidateUser(userId: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key =>
      key.startsWith(`${userId}_`)
    );

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.lastUpdate.delete(key);
    });
  }

  /**
   * 清空所有缓存
   */
  clearAll(): void {
    this.cache.clear();
    this.lastUpdate.clear();
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      totalUsers: new Set(
        Array.from(this.cache.keys()).map(key => key.split('_')[0])
      ).size,
    };
  }
}

// 全局权限缓存管理器实例
const permissionCacheManager = new PermissionCacheManager();

/**
 * 批量权限检查
 */
export function checkMultiplePermissions(
  user: AuthUser | null,
  permissions: string[]
): Record<string, boolean> {
  if (!user?.role || !user.id) {
    return permissions.reduce(
      (result, permission) => {
        result[permission] = false;
        return result;
      },
      {} as Record<string, boolean>
    );
  }

  const permissionCache = permissionCacheManager.getPermissions(
    user.id,
    user.role
  );

  return permissions.reduce(
    (result, permission) => {
      result[permission] = permissionCache.has(permission);
      return result;
    },
    {} as Record<string, boolean>
  );
}

/**
 * 增强的权限检查函数，支持缓存
 */
export function checkPermissionWithCache(
  user: AuthUser | null,
  permission?: string,
  role?: UserRole,
  customCheck?: (user: AuthUser) => boolean
): boolean {
  if (!user) return false;

  if (customCheck) {
    return customCheck(user);
  }

  if (permission && user.id && user.role) {
    const permissionCache = permissionCacheManager.getPermissions(
      user.id,
      user.role
    );
    return permissionCache.has(permission);
  }

  if (role) {
    return hasRole(user, role);
  }

  return true;
}

/**
 * 权限缓存管理器导出
 */
export { permissionCacheManager };

/**
 * 权限检查装饰器
 */
export function requirePermission(permission: string) {
  return function <T extends (...args: unknown[]) => unknown>(
    __target: unknown,
    __propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (this: unknown, ...args: unknown[]) {
      // 注意：这里不能使用useAuthStore，因为装饰器不在React组件中
      // 实际使用时需要在组件中进行权限检查
      console.warn(
        `权限检查装饰器需要在React组件中使用权限检查: ${permission}`
      );

      return originalMethod?.apply(this, args);
    } as T;

    return descriptor;
  };
}
