/**
 * 生产环境认证修复
 * 解决生产环境中认证状态初始化和维护问题
 */

import type { Session } from '@supabase/supabase-js';

import { useAuthStore } from '../stores/auth.store';

import { ensureAuthentication, supabase } from './supabase';
import { getDatabaseOptions } from './supabase-config';

// 生产环境认证状态管理
class ProductionAuthManager {
  private isInitialized = false;
  private retryCount = 0;
  private maxRetries = 3;
  private retryDelay = 1000;

  /**
   * 初始化生产环境认证
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    console.log('🏭 初始化生产环境认证...');

    try {
      // 1. 清理可能损坏的会话数据
      await this.cleanupCorruptedSession();

      // 2. 检查现有会话
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('获取会话失败:', error);
        // 如果是认证错误，清理存储并重试
        if (
          error.message?.includes('Invalid') ||
          error.message?.includes('expired')
        ) {
          await this.clearAuthStorage();
          return false;
        }
        return false;
      }

      // 3. 如果有会话，验证其有效性
      if (session) {
        const isValid = await this.validateSession(session);
        if (isValid) {
          console.log('✅ 现有会话有效');
          this.isInitialized = true;
          return true;
        } else {
          // 会话无效，清理并重试
          await this.clearAuthStorage();
        }
      }

      // 4. 尝试从存储中恢复会话
      const restored = await this.restoreSessionFromStorage();
      if (restored) {
        console.log('✅ 从存储恢复会话成功');
        this.isInitialized = true;
        return true;
      }

      // 5. 如果都失败，需要重新登录
      console.warn('⚠️ 需要重新登录');
      return false;
    } catch (error) {
      console.error('认证初始化失败:', error);
      await this.clearAuthStorage();
      return false;
    }
  }

  /**
   * 验证会话有效性
   */
  private async validateSession(session: Session): Promise<boolean> {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        console.error('会话验证失败:', error);
        return false;
      }

      // 更新认证状态
      const authStore = useAuthStore.getState();
      authStore.setUser({
        ...user,
        role: user.user_metadata?.role || 'operator',
      });
      authStore.setSession(session);

      return true;
    } catch (error) {
      console.error('会话验证异常:', error);
      return false;
    }
  }

  /**
   * 从存储中恢复会话
   */
  private async restoreSessionFromStorage(): Promise<boolean> {
    try {
      // 使用与 Supabase 配置一致的存储键
      const storageKey =
        getDatabaseOptions().auth?.storageKey || 'pharmacy-auth';
      const storedAuth = localStorage.getItem(storageKey);

      if (!storedAuth) {
        return false;
      }

      const authData = JSON.parse(storedAuth);

      if (!authData.state?.session) {
        return false;
      }

      // 让 Supabase 自己管理会话刷新：仅在有可用 refresh_token 时设置
      const candidate = authData.state.session as Partial<Session>;
      if (!candidate.refresh_token || !candidate.access_token) {
        return false;
      }

      const { error } = await supabase.auth.setSession({
        access_token: candidate.access_token,
        refresh_token: candidate.refresh_token,
      } as Session);

      if (error) {
        console.error('恢复会话失败:', error);
        // 清理无效的存储数据
        localStorage.removeItem('pharmacy-auth-storage');
        return false;
      }

      return true;
    } catch (error) {
      console.error('从存储恢复会话异常:', error);
      return false;
    }
  }

  /**
   * 重试认证初始化
   */
  async retryInitialization(): Promise<boolean> {
    if (this.retryCount >= this.maxRetries) {
      console.error('认证初始化重试次数已达上限');
      return false;
    }

    this.retryCount++;
    console.log(`🔄 重试认证初始化 (${this.retryCount}/${this.maxRetries})`);

    // 等待一段时间后重试
    await new Promise(resolve =>
      setTimeout(resolve, this.retryDelay * this.retryCount)
    );

    return await this.initialize();
  }

  /**
   * 设置认证监听器
   */
  setupAuthListener(): void {
    // 为避免与应用层监听重复，这里仅在尚未初始化时挂一次监听
    if (this.isInitialized) return;
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 认证状态变化:', event);

      const authStore = useAuthStore.getState();

      switch (event) {
        case 'SIGNED_IN':
          if (session?.user) {
            await this.validateSession(session);
          }
          break;

        case 'SIGNED_OUT':
          authStore.signOut();
          this.isInitialized = false;
          break;

        case 'TOKEN_REFRESHED':
          console.log('🔄 令牌已刷新');
          break;

        case 'USER_UPDATED':
          if (session?.user) {
            await this.validateSession(session);
          }
          break;
      }
    });
  }

  /**
   * 检查是否已初始化
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * 重置管理器状态
   */
  reset(): void {
    this.isInitialized = false;
    this.retryCount = 0;
  }

  /**
   * 清理损坏的会话数据
   */
  private async cleanupCorruptedSession(): Promise<void> {
    try {
      // 检查是否有损坏的令牌
      const storedAuth = localStorage.getItem('pharmacy-auth-storage');
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        const session = authData.state?.session;

        if (session && session.expires_at) {
          const expiresAt = new Date(session.expires_at * 1000);
          const now = new Date();

          // 如果令牌已过期，清理存储
          if (expiresAt <= now) {
            console.log('🧹 清理过期的会话数据');
            await this.clearAuthStorage();
          }
        }
      }
    } catch (error) {
      console.error('清理会话数据时出错:', error);
      await this.clearAuthStorage();
    }
  }

  /**
   * 清理认证存储
   */
  private async clearAuthStorage(): Promise<void> {
    try {
      // 清理本地存储（与 Supabase 配置的键一致）
      const storageKey =
        getDatabaseOptions().auth?.storageKey || 'pharmacy-auth';
      localStorage.removeItem(storageKey);

      // 清理 Supabase 会话
      await supabase.auth.signOut({ scope: 'local' });

      console.log('🧹 已清理认证存储');
    } catch (error) {
      console.error('清理认证存储失败:', error);
    }
  }
}

// 创建全局实例
export const productionAuthManager = new ProductionAuthManager();

/**
 * 生产环境认证初始化函数
 */
export async function initializeProductionAuth(): Promise<boolean> {
  // 只在生产环境执行
  if (import.meta.env.DEV) {
    console.log('开发环境，跳过生产认证初始化');
    return true;
  }

  console.log('🏭 开始生产环境认证初始化...');

  // 设置认证监听器
  productionAuthManager.setupAuthListener();

  // 初始化认证
  let success = await productionAuthManager.initialize();

  // 如果失败，尝试重试
  if (!success) {
    success = await productionAuthManager.retryInitialization();
  }

  if (success) {
    console.log('✅ 生产环境认证初始化成功');
  } else {
    console.error('❌ 生产环境认证初始化失败');
  }

  return success;
}

/**
 * 确保认证状态有效的装饰器函数
 */
export function withAuthentication<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    // 检查认证状态
    const isAuthenticated = await ensureAuthentication();

    if (!isAuthenticated) {
      // 尝试重新初始化
      const initialized = await productionAuthManager.initialize();

      if (!initialized) {
        throw new Error('用户未认证，请重新登录');
      }
    }

    return await fn(...args);
  };
}
