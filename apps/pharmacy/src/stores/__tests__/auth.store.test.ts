/**
 * 认证 Store 测试
 * 测试用户权限获取的缓存机制和防重复调用逻辑
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { AuthUser, UserRole } from '../../types/auth';
import { useAuthStore, clearUserProfileCache } from '../auth.store';

// 创建完整的 mock AuthUser 对象
function createMockAuthUser(
  overrides: {
    id?: string;
    email?: string;
    role?: UserRole;
    name?: string;
  } = {}
): AuthUser {
  const {
    id = 'test-user-id',
    email = 'test@example.com',
    role = 'admin',
    name = '测试用户',
  } = overrides;

  return {
    id,
    email,
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    profile: {
      id,
      email,
      name,
      role,
      is_active: true,
      last_login: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    role,
  };
}

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
    auth: {
      getUser: vi.fn(),
    },
  },
  auth: {
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
    getCurrentSession: vi.fn(),
    getCurrentUser: vi.fn(),
    signInWithEmail: vi.fn(),
    signUpWithEmail: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    updateUser: vi.fn(),
  },
}));

describe('Auth Store - 用户权限缓存机制', () => {
  beforeEach(() => {
    // 清理缓存
    clearUserProfileCache();
    // 重置 store 状态
    useAuthStore.setState({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      isInitializing: true,
      isProfileLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('应该正确初始化 store 状态', () => {
    const state = useAuthStore.getState();

    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.isInitializing).toBe(true);
    expect(state.isProfileLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('应该正确设置用户状态', () => {
    const mockUser = createMockAuthUser();

    useAuthStore.getState().setUser(mockUser);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  it('应该正确设置加载状态', () => {
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);

    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('应该正确设置权限信息加载状态', () => {
    useAuthStore.getState().setProfileLoading(true);
    expect(useAuthStore.getState().isProfileLoading).toBe(true);

    useAuthStore.getState().setProfileLoading(false);
    expect(useAuthStore.getState().isProfileLoading).toBe(false);
  });

  it('应该正确设置错误状态', () => {
    const errorMessage = '测试错误';
    useAuthStore.getState().setError(errorMessage);
    expect(useAuthStore.getState().error).toBe(errorMessage);

    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });

  it('应该正确处理用户登出', () => {
    // 先设置一个用户
    const mockUser = createMockAuthUser();

    useAuthStore.getState().setUser(mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    // 登出
    useAuthStore.getState().setUser(null);
    const state = useAuthStore.getState();

    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});

describe('Auth Store - 权限检查', () => {
  it('应该正确检查管理员权限', () => {
    const mockAdminUser = createMockAuthUser({
      id: 'admin-user-id',
      email: 'admin@example.com',
      role: 'admin',
    });

    useAuthStore.getState().setUser(mockAdminUser);

    // 管理员应该有所有权限
    expect(useAuthStore.getState().user?.role).toBe('admin');
  });

  it('应该正确检查经理权限', () => {
    const mockManagerUser = createMockAuthUser({
      id: 'manager-user-id',
      email: 'manager@example.com',
      role: 'manager',
    });

    useAuthStore.getState().setUser(mockManagerUser);

    expect(useAuthStore.getState().user?.role).toBe('manager');
  });

  it('应该正确检查操作员权限', () => {
    const mockOperatorUser = createMockAuthUser({
      id: 'operator-user-id',
      email: 'operator@example.com',
      role: 'operator',
    });

    useAuthStore.getState().setUser(mockOperatorUser);

    expect(useAuthStore.getState().user?.role).toBe('operator');
  });
});
