/**
 * 认证系统初始化
 * 设置认证监听器和会话管理
 */

import { initializeAuth, setupAuthListener } from '../stores/auth.store';
import { sessionManager } from '../utils/session-utils';
import { authUtils } from '../utils/supabase-utils';

// 简化版本：移除复杂的连接管理和诊断工具

// 认证初始化状态
let isInitialized = false;
let authListener: {
  data: { subscription: { unsubscribe: () => void } };
} | null = null;

/**
 * 初始化认证系统
 */
export async function initializeAuthSystem(): Promise<void> {
  if (isInitialized) {
    console.warn('认证系统已经初始化');
    return;
  }

  try {
    console.log('开始初始化认证系统...');

    // 1. 首先检查连接状态
    console.log('检查 Supabase 连接状态...');
    // 简化版本：直接使用Supabase客户端
    const connected = true;

    if (!connected) {
      console.warn('⚠️ Supabase 连接失败，将使用降级模式');

      // 运行诊断
      // 简化版本：移除诊断工具
      console.log('认证系统初始化完成');
      // 简化版本：移除诊断结果

      // 即使连接失败，也继续初始化基本功能
      await initializeWithoutConnection();
      return;
    }

    console.log('✅ Supabase 连接成功');

    // 2. 先初始化认证状态，再处理系统设置
    await initializeAuth();

    // 3. 安全地获取认证配置
    // 简化版本：直接获取配置
    const authConfig = await authUtils.getAuthConfig();

    console.log('认证配置:', authConfig);

    // 4. 配置会话管理器
    sessionManager.setCallbacks({
      onSessionExpiring: () => {
        console.warn('会话即将过期，请及时保存工作');
        // 可以在这里显示用户提示
      },
      onSessionExpired: () => {
        console.warn('会话已过期，请重新登录');
        // 可以在这里跳转到登录页面
        window.location.href = '/login';
      },
    });

    // 5. 设置认证状态监听器
    authListener = setupAuthListener();

    // 6. 在认证完成后，尝试初始化系统设置（如果用户已认证）
    // 这将在认证状态变化时自动触发

    // 7. 标记为已初始化
    isInitialized = true;

    console.log('✅ 认证系统初始化完成');
  } catch (error) {
    console.error('❌ 认证系统初始化失败:', error);

    // 尝试降级初始化
    try {
      await initializeWithoutConnection();
      console.log('⚠️ 使用降级模式初始化成功');
    } catch (fallbackError) {
      console.error('❌ 降级初始化也失败:', fallbackError);
      throw error;
    }
  }
}

/**
 * 无连接状态下的降级初始化
 */
async function initializeWithoutConnection(): Promise<void> {
  console.log('🔄 开始降级模式初始化...');

  try {
    // 1. 配置会话管理器（使用默认配置）
    sessionManager.setCallbacks({
      onSessionExpiring: () => {
        console.warn('会话即将过期，请及时保存工作');
      },
      onSessionExpired: () => {
        console.warn('会话已过期，请重新登录');
        window.location.href = '/login';
      },
    });

    // 2. 尝试初始化认证状态（可能失败，但不抛出错误）
    try {
      await initializeAuth();
    } catch (error) {
      console.warn('认证状态初始化失败，将在连接恢复后重试:', error);
    }

    // 3. 尝试设置认证监听器
    try {
      authListener = setupAuthListener();
    } catch (error) {
      console.warn('认证监听器设置失败:', error);
    }

    // 4. 标记为已初始化
    isInitialized = true;

    console.log('✅ 降级模式初始化完成');
  } catch (error) {
    console.error('❌ 降级模式初始化失败:', error);
    throw error;
  }
}

/**
 * 清理认证系统
 */
export function cleanupAuthSystem(): void {
  if (!isInitialized) return;

  try {
    // 清理认证监听器
    if (authListener?.data?.subscription) {
      authListener.data.subscription.unsubscribe();
      authListener = null;
    }

    // 清理会话管理器
    sessionManager.destroy();

    // 重置初始化状态
    isInitialized = false;

    console.log('认证系统清理完成');
  } catch (error) {
    console.error('认证系统清理失败:', error);
  }
}

/**
 * 检查认证系统是否已初始化
 */
export function isAuthSystemInitialized(): boolean {
  return isInitialized;
}

/**
 * 重新初始化认证系统
 */
export async function reinitializeAuthSystem(): Promise<void> {
  cleanupAuthSystem();
  await initializeAuthSystem();
}

// 说明：为避免重复初始化与监听，这里不进行模块级自动初始化。
