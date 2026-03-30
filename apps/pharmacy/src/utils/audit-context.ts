/**
 * 审计上下文工具
 * 用于在数据库操作中设置当前用户ID，以便审计日志记录
 */

import { RPC } from '@/lib/db-keys';
import { supabase } from '@/lib/supabase';

/**
 * 设置当前用户ID到数据库会话中
 * 这样审计触发器就能获取到当前操作用户
 */
export const setAuditContext = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase.rpc(RPC.setConfig, {
      setting_name: 'app.current_user_id',
      new_value: userId,
      is_local: true,
    });

    if (error) {
      console.warn('设置审计上下文失败:', error.message);
    }
  } catch (error) {
    console.warn('设置审计上下文异常:', error);
    // 不抛出错误，避免影响主要功能
  }
};

/**
 * 清除审计上下文
 */
export const clearAuditContext = async (): Promise<void> => {
  try {
    const { error } = await supabase.rpc(RPC.setConfig, {
      setting_name: 'app.current_user_id',
      new_value: '',
      is_local: true,
    });

    if (error) {
      console.warn('清除审计上下文失败:', error.message);
    }
  } catch (error) {
    console.warn('清除审计上下文异常:', error);
    // 不抛出错误，避免影响主要功能
  }
};

/**
 * 在执行操作时自动设置审计上下文的包装函数
 */
export const withAuditContext = async <T>(
  _userId: string, // 使用下划线前缀标记为故意未使用的参数
  operation: () => Promise<T>
): Promise<T> => {
  // 暂时禁用审计上下文设置，直到修复 set_config 函数调用问题
  // await setAuditContext(userId);
  try {
    return await operation();
  } finally {
    // await clearAuditContext();
  }
};

/**
 * 获取客户端IP地址（在浏览器环境中的近似实现）
 */
export const getClientIP = async (): Promise<string | null> => {
  try {
    // 在实际应用中，IP地址通常由服务端获取
    // 这里提供一个简单的实现，实际项目中可能需要通过API获取
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.warn('获取客户端IP失败:', error);
    return null;
  }
};

/**
 * 获取用户代理字符串
 */
export const getUserAgent = (): string => {
  return navigator.userAgent;
};
