/**
 * Supabase 工具函数
 * 提供数据库操作的便捷方法
 */

import { supabase } from '../lib/supabase';
import type { UserMetadata, UserRole } from '../types/auth';
import type {
  InsertUser,
  SystemSetting,
  UpdateUser,
  User,
} from '../types/database';

import { TABLES } from '@/lib/db-keys';

// 用户管理工具
export const userUtils = {
  /**
   * 根据 ID 获取用户
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.users)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('获取用户失败:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('获取用户异常:', error);
      return null;
    }
  },

  /**
   * 根据邮箱获取用户
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.users)
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        console.error('获取用户失败:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('获取用户异常:', error);
      return null;
    }
  },

  /**
   * 获取所有用户
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.users)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('获取用户列表失败:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('获取用户列表异常:', error);
      return [];
    }
  },

  /**
   * 根据角色获取用户
   */
  async getUsersByRole(role: UserRole): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.users)
        .select('*')
        .eq('role', role)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('获取用户列表失败:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('获取用户列表异常:', error);
      return [];
    }
  },

  /**
   * 创建用户
   */
  async createUser(userData: InsertUser): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.users)
        .insert(userData)
        .select()
        .single();

      if (error) {
        console.error('创建用户失败:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('创建用户异常:', error);
      throw error;
    }
  },

  /**
   * 更新用户
   */
  async updateUser(id: string, userData: UpdateUser): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.users)
        .update({
          ...userData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('更新用户失败:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('更新用户异常:', error);
      throw error;
    }
  },

  /**
   * 删除用户
   */
  async deleteUser(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from(TABLES.users).delete().eq('id', id);

      if (error) {
        console.error('删除用户失败:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('删除用户异常:', error);
      throw error;
    }
  },

  /**
   * 检查邮箱是否已存在
   */
  async isEmailExists(email: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase.from(TABLES.users).select('id').eq('email', email);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('检查邮箱失败:', error);
        return false;
      }

      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('检查邮箱异常:', error);
      return false;
    }
  },
};

// 系统设置工具
export const settingsUtils = {
  /**
   * 获取系统设置
   */
  async getSetting(key: string): Promise<SystemSetting | null> {
    try {
      // 检查用户是否已认证
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.log(`用户未认证，跳过获取系统设置: ${key}`);
        return null;
      }

      // 使用认证查询确保用户已登录，不使用single()避免406错误
      const { data, error } = await supabase
        .from(TABLES.systemSettings)
        .select('*')
        .eq('key', key)
        .limit(1);

      if (error) {
        console.warn(`获取系统设置失败 (${key}):`, error.message);
        return null;
      }

      // 如果没有找到数据，返回null
      if (!data || data.length === 0) {
        console.warn(`系统设置不存在 (${key})`);
        return null;
      }

      return data[0] as {
        id: string;
        key: string;
        value: string;
        description: string | null;
        created_at: string;
        updated_at: string;
      } | null;
    } catch (error) {
      console.warn(`获取系统设置异常 (${key}):`, error);
      return null;
    }
  },

  /**
   * 获取系统设置值
   */
  async getSettingValue(
    key: string,
    defaultValue?: string
  ): Promise<string | null> {
    const setting = await this.getSetting(key);
    return setting?.value || defaultValue || null;
  },

  /**
   * 获取所有系统设置
   */
  async getAllSettings(): Promise<SystemSetting[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.systemSettings)
        .select('*')
        .order('key');

      if (error) {
        console.error('获取系统设置列表失败:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('获取系统设置列表异常:', error);
      return [];
    }
  },

  /**
   * 设置系统配置
   */
  async setSetting(
    key: string,
    value: string,
    description?: string
  ): Promise<SystemSetting | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.systemSettings)
        .upsert({
          key,
          value,
          description,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('设置系统配置失败:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('设置系统配置异常:', error);
      throw error;
    }
  },

  /**
   * 批量设置系统配置
   */
  async setMultipleSettings(
    settings: Array<{ key: string; value: string; description?: string }>
  ): Promise<SystemSetting[]> {
    try {
      const settingsData = settings.map(setting => ({
        ...setting,
        updated_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from(TABLES.systemSettings)
        .upsert(settingsData)
        .select();

      if (error) {
        console.error('批量设置系统配置失败:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('批量设置系统配置异常:', error);
      throw error;
    }
  },

  /**
   * 删除系统设置
   */
  async deleteSetting(key: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(TABLES.systemSettings)
        .delete()
        .eq('key', key);

      if (error) {
        console.error('删除系统设置失败:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('删除系统设置异常:', error);
      throw error;
    }
  },
};

// 认证相关工具
export const authUtils = {
  /**
   * 同步认证用户到业务用户表
   */
  async syncAuthUser(
    authUserId: string,
    metadata: UserMetadata
  ): Promise<User | null> {
    try {
      // 获取认证用户以读取真实邮箱
      const { data: authUserData } = await supabase.auth.getUser();
      const authEmail = authUserData.user?.email;
      // 检查用户是否已存在
      const existingUser = await userUtils.getUserById(authUserId);

      if (existingUser) {
        // 更新现有用户
        return await userUtils.updateUser(authUserId, {
          name: metadata.name,
          role: metadata.role,
        });
      } else {
        // 创建新用户
        if (!authEmail) {
          throw new Error('认证用户邮箱缺失，无法创建业务用户记录');
        }
        return await userUtils.createUser({
          id: authUserId,
          email: authEmail,
          name: metadata.name,
          role: metadata.role,
        });
      }
    } catch (error) {
      console.error('同步认证用户失败:', error);
      throw error;
    }
  },

  /**
   * 简化版本：手动初始化系统设置（仅在管理页面调用）
   */
  async initializeDefaultSettings(): Promise<void> {
    // 苹果/谷歌最佳实践：简单、可预测的行为
    console.log('📋 系统设置已预设，如需修改请在管理页面操作');
  },

  /**
   * 获取认证配置
   */
  async getAuthConfig(): Promise<{
    sessionTimeout: number;
    autoRefreshSession: boolean;
    passwordMinLength: number;
    requireEmailVerification: boolean;
    allowSelfRegistration: boolean;
    defaultUserRole: UserRole;
  }> {
    try {
      const [
        sessionTimeout,
        autoRefreshSession,
        passwordMinLength,
        requireEmailVerification,
        allowSelfRegistration,
        defaultUserRole,
      ] = await Promise.all([
        settingsUtils.getSettingValue('session_timeout', '28800'),
        settingsUtils.getSettingValue('auto_refresh_session', 'true'),
        settingsUtils.getSettingValue('password_min_length', '8'),
        settingsUtils.getSettingValue('require_email_verification', 'true'),
        settingsUtils.getSettingValue('allow_self_registration', 'false'),
        settingsUtils.getSettingValue('default_user_role', 'operator'),
      ]);

      return {
        sessionTimeout: parseInt(sessionTimeout || '28800'),
        autoRefreshSession: autoRefreshSession === 'true',
        passwordMinLength: parseInt(passwordMinLength || '8'),
        requireEmailVerification: requireEmailVerification === 'true',
        allowSelfRegistration: allowSelfRegistration === 'true',
        defaultUserRole: (defaultUserRole as UserRole) || 'operator',
      };
    } catch (error) {
      console.error('获取认证配置失败:', error);
      // 返回默认配置
      return {
        sessionTimeout: 28800,
        autoRefreshSession: true,
        passwordMinLength: 8,
        requireEmailVerification: true,
        allowSelfRegistration: false,
        defaultUserRole: 'operator',
      };
    }
  },
};

// 数据库健康检查
export const healthUtils = {
  /**
   * 检查数据库连接
   */
  async checkDatabaseConnection(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(TABLES.systemSettings)
        .select('id')
        .limit(1);

      return !error;
    } catch (error) {
      console.error('数据库连接检查失败:', error);
      return false;
    }
  },

  /**
   * 检查认证服务
   */
  async checkAuthService(): Promise<boolean> {
    try {
      const { error } = await supabase.auth.getSession();
      return !error;
    } catch (error) {
      console.error('认证服务检查失败:', error);
      return false;
    }
  },

  /**
   * 获取系统健康状态
   */
  async getSystemHealth(): Promise<{
    database: boolean;
    auth: boolean;
    overall: boolean;
  }> {
    const [database, auth] = await Promise.all([
      this.checkDatabaseConnection(),
      this.checkAuthService(),
    ]);

    return {
      database,
      auth,
      overall: database && auth,
    };
  },
};

// 连接测试函数（为了兼容现有组件）
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const health = await healthUtils.getSystemHealth();

    if (health.overall) {
      return {
        success: true,
        message: 'Supabase 连接正常，数据库和认证服务都可用',
      };
    } else if (health.database && !health.auth) {
      return {
        success: false,
        message: '数据库连接正常，但认证服务不可用',
      };
    } else if (!health.database && health.auth) {
      return {
        success: false,
        message: '认证服务正常，但数据库连接失败',
      };
    } else {
      return {
        success: false,
        message: '数据库和认证服务都不可用',
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `连接测试失败: ${error instanceof Error ? error.message : '未知错误'}`,
    };
  }
}

// 获取数据库状态函数（为了兼容现有组件）
export async function getDatabaseStatus(): Promise<{ [key: string]: boolean }> {
  const tables = [
    TABLES.users,
    TABLES.medicines,
    TABLES.batches,
    TABLES.inventoryTransactions,
    TABLES.systemSettings,
  ];

  const status: { [key: string]: boolean } = {};

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);

      status[table] = !error;
    } catch (error) {
      console.error(`检查表 ${table} 失败:`, error);
      status[table] = false;
    }
  }

  return status;
}
