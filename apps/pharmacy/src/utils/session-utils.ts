/**
 * 会话管理工具函数
 * 处理会话超时、自动刷新等功能
 */

import type { Session } from '@supabase/supabase-js';

import { auth } from '../lib/supabase';
import { useAuthStore } from '../stores/auth.store';

// 会话配置
export interface SessionConfig {
  // 会话超时时间（秒）
  timeout: number;
  // 刷新阈值（秒）
  refreshThreshold: number;
  // 是否自动刷新
  autoRefresh: boolean;
  // 警告阈值（秒）
  warningThreshold: number;
}

// 默认会话配置
export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  timeout: 8 * 60 * 60, // 8小时
  refreshThreshold: 5 * 60, // 5分钟
  autoRefresh: true,
  warningThreshold: 10 * 60, // 10分钟
};

// 会话管理器类
export class SessionManager {
  private config: SessionConfig;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private warningTimer: ReturnType<typeof setTimeout> | null = null;
  private onSessionExpiring?: () => void;
  private onSessionExpired?: () => void;

  constructor(config: SessionConfig = DEFAULT_SESSION_CONFIG) {
    this.config = config;
  }

  /**
   * 初始化会话管理
   */
  initialize(session: Session | null) {
    this.clearTimers();

    if (session) {
      this.setupSessionTimers(session);
    }
  }

  /**
   * 设置会话过期回调
   */
  setCallbacks(callbacks: {
    onSessionExpiring?: () => void;
    onSessionExpired?: () => void;
  }) {
    this.onSessionExpiring = callbacks.onSessionExpiring;
    this.onSessionExpired = callbacks.onSessionExpired;
  }

  /**
   * 检查会话是否有效
   */
  isSessionValid(session: Session | null): boolean {
    if (!session) return false;

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at;

    return expiresAt ? expiresAt > now : false;
  }

  /**
   * 检查会话是否即将过期
   */
  isSessionExpiringSoon(session: Session | null): boolean {
    if (!session) return false;

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at;

    if (!expiresAt) return false;

    return expiresAt - now <= this.config.warningThreshold;
  }

  /**
   * 获取会话剩余时间（秒）
   */
  getSessionTimeRemaining(session: Session | null): number {
    if (!session?.expires_at) return 0;

    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, session.expires_at - now);
  }

  /**
   * 刷新会话
   */
  async refreshSession(): Promise<Session | null> {
    try {
      const { data, error } = await auth.refreshSession();

      if (error) {
        console.error('刷新会话失败:', error);
        this.handleSessionExpired();
        return null;
      }

      if (data.session) {
        this.setupSessionTimers(data.session);
        useAuthStore.getState().setSession(data.session);
        return data.session;
      }

      return null;
    } catch (error) {
      console.error('刷新会话异常:', error);
      this.handleSessionExpired();
      return null;
    }
  }

  /**
   * 设置会话定时器
   */
  private setupSessionTimers(session: Session) {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at;

    if (!expiresAt) return;

    const timeUntilExpiry = (expiresAt - now) * 1000; // 转换为毫秒
    const timeUntilWarning = Math.max(
      0,
      timeUntilExpiry - this.config.warningThreshold * 1000
    );
    const timeUntilRefresh = Math.max(
      0,
      timeUntilExpiry - this.config.refreshThreshold * 1000
    );

    // 设置警告定时器
    if (timeUntilWarning > 0) {
      this.warningTimer = setTimeout(() => {
        this.handleSessionExpiring();
      }, timeUntilWarning);
    }

    // 设置自动刷新定时器
    if (this.config.autoRefresh && timeUntilRefresh > 0) {
      this.refreshTimer = setTimeout(async () => {
        await this.refreshSession();
      }, timeUntilRefresh);
    }
  }

  /**
   * 处理会话即将过期
   */
  private handleSessionExpiring() {
    console.warn('会话即将过期');
    this.onSessionExpiring?.();
  }

  /**
   * 处理会话已过期
   */
  private handleSessionExpired() {
    console.warn('会话已过期');
    this.clearTimers();
    this.onSessionExpired?.();

    // 清除认证状态
    const authStore = useAuthStore.getState();
    authStore.setUser(null);
    authStore.setSession(null);
  }

  /**
   * 清除所有定时器
   */
  private clearTimers() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  /**
   * 销毁会话管理器
   */
  destroy() {
    this.clearTimers();
    this.onSessionExpiring = undefined;
    this.onSessionExpired = undefined;
  }
}

// 全局会话管理器实例
export const sessionManager = new SessionManager();

/**
 * 格式化会话剩余时间
 */
export function formatSessionTimeRemaining(session: Session | null): string {
  if (!session?.expires_at) return '未知';

  const remaining = sessionManager.getSessionTimeRemaining(session);

  if (remaining <= 0) return '已过期';

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);

  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  } else if (minutes > 0) {
    return `${minutes}分钟`;
  } else {
    return '不到1分钟';
  }
}

/**
 * 获取会话状态信息
 */
export function getSessionStatus(session: Session | null): {
  isValid: boolean;
  isExpiringSoon: boolean;
  timeRemaining: number;
  timeRemainingFormatted: string;
} {
  return {
    isValid: sessionManager.isSessionValid(session),
    isExpiringSoon: sessionManager.isSessionExpiringSoon(session),
    timeRemaining: sessionManager.getSessionTimeRemaining(session),
    timeRemainingFormatted: formatSessionTimeRemaining(session),
  };
}

/**
 * 会话监控 Hook 工厂
 */
export function createSessionMonitor() {
  let intervalId: ReturnType<typeof setTimeout> | null = null;

  return {
    start: (
      callback: (status: ReturnType<typeof getSessionStatus>) => void,
      interval: number = 60000
    ) => {
      intervalId = setInterval(() => {
        const session = useAuthStore.getState().session;
        const status = getSessionStatus(session);
        callback(status);
      }, interval);
    },

    stop: () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },
  };
}
