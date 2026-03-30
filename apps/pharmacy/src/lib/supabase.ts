/**
 * Supabase 客户端配置
 * 提供与 Supabase 服务的连接和交互
 */

import {
  createClient,
  type PostgrestError,
  type Session,
} from '@supabase/supabase-js';

import type { Database } from '../types/database';

import { RPC } from './db-keys';
import {
  getDatabaseOptions,
  handleEnvironmentError,
  supabaseConfig,
} from './supabase-config';

// 创建 Supabase 客户端实例
export const supabase = createClient<Database>(
  supabaseConfig.url,
  supabaseConfig.anonKey,
  getDatabaseOptions()
);

// 检查 Supabase 连接状态
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc(RPC.healthCheck);
    return !error && !!data && data.ok === true;
  } catch (error) {
    handleEnvironmentError(error, 'connection-check');
    return false;
  }
}

// 检查认证状态并确保会话有效
export async function ensureAuthentication(): Promise<boolean> {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error('获取会话失败:', error);
      return false;
    }

    if (!session) {
      console.warn('用户未认证');
      return false;
    }

    // 验证会话是否有效
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('用户会话无效:', userError);
      return false;
    }

    return true;
  } catch (error) {
    handleEnvironmentError(error, 'authentication-check');
    return false;
  }
}

// 带认证检查的安全查询函数
export async function authenticatedQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>
): Promise<{
  data: T | null;
  error: PostgrestError | { message: string; code: string } | null;
}> {
  // 首先检查认证状态
  const isAuthenticated = await ensureAuthentication();

  if (!isAuthenticated) {
    return {
      data: null,
      error: { message: '用户未认证，请重新登录', code: 'UNAUTHENTICATED' },
    };
  }

  // 执行查询
  return await queryFn();
}

// 认证相关工具函数
export const auth = {
  // 获取当前用户
  getCurrentUser: () => supabase.auth.getUser(),

  // 获取当前会话
  getCurrentSession: () => supabase.auth.getSession(),

  // 监听认证状态变化
  onAuthStateChange: (
    callback: (event: string, session: Session | null) => void
  ) => supabase.auth.onAuthStateChange(callback),

  // 邮箱密码登录
  signInWithEmail: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),

  // 邮箱注册
  signUpWithEmail: (
    email: string,
    password: string,
    metadata?: Record<string, unknown>
  ) =>
    supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    }),

  // 退出登录
  signOut: () => supabase.auth.signOut(),

  // 重置密码
  resetPassword: (email: string) =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    }),

  // 更新用户信息
  updateUser: (attributes: {
    email?: string;
    password?: string;
    data?: Record<string, unknown>;
  }) => supabase.auth.updateUser(attributes),

  // 刷新会话
  refreshSession: () => supabase.auth.refreshSession(),
};

// 导出 Supabase 客户端实例
export default supabase;
