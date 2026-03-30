import { describe, expect, it } from 'vitest';

import type { AuthUser, UserRole } from '../../types/auth';
import {
  canManageRole,
  createPermissionChecker,
  formatSessionTimeRemaining,
  formatUserDisplayName,
  generateRandomPassword,
  getAllRoles,
  getManageableRoles,
  getUserRoleLabel,
  hasPermission,
  hasRole,
  isSessionExpiringSoon,
  validateEmail,
  validatePassword,
} from '../auth-utils';

// 创建测试用户
const createTestUser = (role: UserRole, overrides = {}): AuthUser => ({
  id: '1',
  email: 'test@example.com',
  role,
  created_at: '2024-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  ...overrides,
});

describe('auth-utils', () => {
  describe('hasPermission', () => {
    it('should return true for admin with any permission', () => {
      const admin = createTestUser('admin');
      expect(hasPermission(admin, 'user:create')).toBe(true);
      expect(hasPermission(admin, 'system:config')).toBe(true);
    });

    it('should return false for operator with admin permissions', () => {
      const operator = createTestUser('operator');
      expect(hasPermission(operator, 'user:create')).toBe(false);
      expect(hasPermission(operator, 'system:config')).toBe(false);
    });

    it('should return true for operator with allowed permissions', () => {
      const operator = createTestUser('operator');
      expect(hasPermission(operator, 'medicine:read')).toBe(true);
      expect(hasPermission(operator, 'inventory:create')).toBe(true);
    });

    it('should return false for null user', () => {
      expect(hasPermission(null, 'user:create')).toBe(false);
    });

    it('should return false for user without role', () => {
      const user = { id: '1', email: 'test@example.com' } as AuthUser;
      expect(hasPermission(user, 'user:create')).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true for exact role match', () => {
      const manager = createTestUser('manager');
      expect(hasRole(manager, 'manager')).toBe(true);
    });

    it('should return true for higher role', () => {
      const admin = createTestUser('admin');
      expect(hasRole(admin, 'manager')).toBe(true);
      expect(hasRole(admin, 'operator')).toBe(true);
    });

    it('should return false for lower role', () => {
      const operator = createTestUser('operator');
      expect(hasRole(operator, 'manager')).toBe(false);
      expect(hasRole(operator, 'admin')).toBe(false);
    });

    it('should return false for null user', () => {
      expect(hasRole(null, 'operator')).toBe(false);
    });
  });

  describe('canManageRole', () => {
    it('should allow admin to manage all roles', () => {
      expect(canManageRole('admin', 'manager')).toBe(true);
      expect(canManageRole('admin', 'operator')).toBe(true);
    });

    it('should allow manager to manage operator', () => {
      expect(canManageRole('manager', 'operator')).toBe(true);
    });

    it('should not allow lower roles to manage higher roles', () => {
      expect(canManageRole('operator', 'manager')).toBe(false);
      expect(canManageRole('operator', 'admin')).toBe(false);
      expect(canManageRole('manager', 'admin')).toBe(false);
    });

    it('should not allow same role to manage itself', () => {
      expect(canManageRole('admin', 'admin')).toBe(false);
      expect(canManageRole('manager', 'manager')).toBe(false);
      expect(canManageRole('operator', 'operator')).toBe(false);
    });
  });

  describe('getManageableRoles', () => {
    it('should return correct manageable roles for admin', () => {
      const roles = getManageableRoles('admin');
      expect(roles).toContain('manager');
      expect(roles).toContain('operator');
      expect(roles).not.toContain('admin');
    });

    it('should return correct manageable roles for manager', () => {
      const roles = getManageableRoles('manager');
      expect(roles).toContain('operator');
      expect(roles).not.toContain('manager');
      expect(roles).not.toContain('admin');
    });

    it('should return empty array for operator', () => {
      const roles = getManageableRoles('operator');
      expect(roles).toHaveLength(0);
    });
  });

  describe('getAllRoles', () => {
    it('should return all roles with labels and descriptions', () => {
      const roles = getAllRoles();
      expect(roles).toHaveLength(3);

      const adminRole = roles.find(r => r.value === 'admin');
      expect(adminRole).toBeDefined();
      expect(adminRole?.label).toBe('系统管理员');
      expect(adminRole?.description).toBeTruthy();
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test.example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate password against default policy', () => {
      const result1 = validatePassword('Password123');
      expect(result1.isValid).toBe(true);
      expect(result1.errors).toHaveLength(0);

      const result2 = validatePassword('weak');
      expect(result2.isValid).toBe(false);
      expect(result2.errors.length).toBeGreaterThan(0);
    });

    it('should validate password against custom policy', () => {
      const customPolicy = {
        minLength: 6,
        requireUppercase: false,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
      };

      const result = validatePassword('pass123!', customPolicy);
      expect(result.isValid).toBe(true);
    });

    it('should return specific error messages', () => {
      const result = validatePassword('abc');
      expect(result.errors).toContain('密码长度至少需要 8 位');
      expect(result.errors).toContain('密码必须包含至少一个大写字母');
      expect(result.errors).toContain('密码必须包含至少一个数字');
    });
  });

  describe('generateRandomPassword', () => {
    it('should generate password with correct length', () => {
      const password = generateRandomPassword(12);
      expect(password).toHaveLength(12);
    });

    it('should generate password with default length', () => {
      const password = generateRandomPassword();
      expect(password).toHaveLength(12);
    });

    it('should generate passwords that meet policy requirements', () => {
      const password = generateRandomPassword(12);
      const validation = validatePassword(password);
      expect(validation.isValid).toBe(true);
    });

    it('should generate different passwords each time', () => {
      const password1 = generateRandomPassword();
      const password2 = generateRandomPassword();
      expect(password1).not.toBe(password2);
    });
  });

  describe('formatUserDisplayName', () => {
    it('should use profile name if available', () => {
      const user = createTestUser('operator', {
        profile: { name: 'John Doe' },
      });
      expect(formatUserDisplayName(user)).toBe('John Doe');
    });

    it('should use user_metadata name if profile name not available', () => {
      const user = createTestUser('operator', {
        user_metadata: { name: 'Jane Smith' },
      });
      expect(formatUserDisplayName(user)).toBe('Jane Smith');
    });

    it('should use email if no name available', () => {
      const user = createTestUser('operator');
      expect(formatUserDisplayName(user)).toBe('test@example.com');
    });

    it('should return default text if no email available', () => {
      const user = createTestUser('operator', { email: undefined });
      expect(formatUserDisplayName(user)).toBe('未知用户');
    });
  });

  describe('getUserRoleLabel', () => {
    it('should return correct role labels', () => {
      expect(getUserRoleLabel('admin')).toBe('系统管理员');
      expect(getUserRoleLabel('manager')).toBe('库存经理');
      expect(getUserRoleLabel('operator')).toBe('操作员');
    });

    it('should return default for undefined role', () => {
      expect(getUserRoleLabel(undefined)).toBe('未知角色');
    });

    it('should return role itself for unknown role', () => {
      expect(getUserRoleLabel('unknown' as UserRole)).toBe('unknown');
    });
  });

  describe('isSessionExpiringSoon', () => {
    it('should return true if session expires within threshold', () => {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = now + 4 * 60; // 4 minutes from now
      expect(isSessionExpiringSoon(expiresAt, 5)).toBe(true);
    });

    it('should return false if session expires after threshold', () => {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = now + 10 * 60; // 10 minutes from now
      expect(isSessionExpiringSoon(expiresAt, 5)).toBe(false);
    });

    it('should return false if expiresAt is undefined', () => {
      expect(isSessionExpiringSoon(undefined, 5)).toBe(false);
    });
  });

  describe('formatSessionTimeRemaining', () => {
    it('should format time remaining correctly', () => {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = now + 3665; // 1 hour, 1 minute, 5 seconds
      expect(formatSessionTimeRemaining(expiresAt)).toBe('1小时1分钟');
    });

    it('should format minutes only', () => {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = now + 300; // 5 minutes
      expect(formatSessionTimeRemaining(expiresAt)).toBe('5分钟');
    });

    it('should return expired for past time', () => {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = now - 100; // 100 seconds ago
      expect(formatSessionTimeRemaining(expiresAt)).toBe('已过期');
    });

    it('should return unknown for undefined', () => {
      expect(formatSessionTimeRemaining(undefined)).toBe('未知');
    });
  });

  describe('createPermissionChecker', () => {
    it('should create permission checker with correct methods', () => {
      const admin = createTestUser('admin');
      const checker = createPermissionChecker(admin);

      expect(checker.hasPermission('user:create')).toBe(true);
      expect(checker.hasRole('manager')).toBe(true);
      expect(checker.canManage('operator')).toBe(true);
    });

    it('should handle null user', () => {
      const checker = createPermissionChecker(null);

      expect(checker.hasPermission('user:create')).toBe(false);
      expect(checker.hasRole('operator')).toBe(false);
      expect(checker.canManage('operator')).toBe(false);
    });
  });
});
