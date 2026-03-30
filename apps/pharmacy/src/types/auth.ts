/**
 * 认证相关类型定义
 */

import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

import type { User } from './database';

// 用户角色类型
export type UserRole = 'admin' | 'manager' | 'operator';

// 扩展的用户类型，包含业务信息
export interface AuthUser extends SupabaseUser {
  // 用户业务信息
  profile?: User;
  // 用户角色
  role?: UserRole;
  // 用户权限
  permissions?: string[];
}

// 登录凭据
export interface LoginCredentials {
  email: string;
  password: string;
}

// 注册信息
export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

// 用户元数据
export interface UserMetadata {
  name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  department?: string;
}

// 认证状态
export interface AuthState {
  // 当前用户
  user: AuthUser | null;
  // 当前会话
  session: Session | null;
  // 是否已认证
  isAuthenticated: boolean;
  // 是否正在加载
  isLoading: boolean;
  // 是否正在初始化
  isInitializing: boolean;
  // 是否正在加载用户权限信息
  isProfileLoading: boolean;
  // 认证错误
  error: string | null;
}

// 认证操作
export interface AuthActions {
  // 登录
  signIn: (credentials: LoginCredentials) => Promise<void>;
  // 注册
  signUp: (data: RegisterData) => Promise<void>;
  // 退出
  signOut: () => Promise<void>;
  // 重置密码
  resetPassword: (email: string) => Promise<void>;
  // 更新用户信息
  updateProfile: (data: Partial<UserMetadata>) => Promise<void>;
  // 刷新用户信息
  refreshUser: () => Promise<void>;
  // 清除错误
  clearError: () => void;
  // 设置用户
  setUser: (user: AuthUser | null) => void;
  // 设置会话
  setSession: (session: Session | null) => void;
  // 设置加载状态
  setLoading: (loading: boolean) => void;
  // 设置错误
  setError: (error: string | null) => void;
  // 设置权限信息加载状态
  setProfileLoading: (loading: boolean) => void;
}

// 权限检查函数类型
export type PermissionChecker = (
  requiredRole: UserRole,
  userRole?: UserRole
) => boolean;

// 认证事件类型
export type AuthEvent =
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY';

// 认证错误类型
export interface AuthError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// 会话配置
export interface SessionConfig {
  // 会话超时时间（秒）
  timeout: number;
  // 刷新阈值（秒）
  refreshThreshold: number;
  // 是否自动刷新
  autoRefresh: boolean;
  // 是否持久化
  persist: boolean;
}

// 密码策略
export interface PasswordPolicy {
  // 最小长度
  minLength: number;
  // 是否需要大写字母
  requireUppercase: boolean;
  // 是否需要小写字母
  requireLowercase: boolean;
  // 是否需要数字
  requireNumbers: boolean;
  // 是否需要特殊字符
  requireSpecialChars: boolean;
}

// 用户注册配置
export interface RegistrationConfig {
  // 是否允许自注册
  allowSelfRegistration: boolean;
  // 是否需要邮箱验证
  requireEmailVerification: boolean;
  // 默认角色
  defaultRole: UserRole;
  // 密码策略
  passwordPolicy: PasswordPolicy;
}
