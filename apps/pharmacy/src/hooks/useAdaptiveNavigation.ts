/**
 * 自适应导航 Hook
 * 处理基于屏幕尺寸和用户权限的导航逻辑
 */

import React, { useEffect, useMemo, useState } from 'react';

import { useAuthStore } from '@/stores/auth.store';
import type { AuthUser, UserRole } from '@/types/auth';
import { hasRole } from '@/utils/auth-utils';

// 标签页配置接口
export interface TabConfig {
  path: string;
  label: string;
  icon: React.ReactNode;
  priority: number;
  requiredRole?: UserRole;
  category?: 'core' | 'management' | 'admin';
}

// 屏幕尺寸类型
export type ScreenSize = 'small' | 'medium' | 'large';

// 导航策略类型
export type NavigationStrategy = 'priority' | 'category' | 'role-based';

// Hook 配置
interface UseAdaptiveNavigationConfig {
  tabs: TabConfig[];
  strategy?: NavigationStrategy;
  maxVisibleTabs?: {
    small: number;
    medium: number;
    large: number;
  };
  breakpoints?: {
    small: number;
    medium: number;
  };
}

// Hook 返回值
interface UseAdaptiveNavigationReturn {
  visibleTabs: TabConfig[];
  overflowTabs: TabConfig[];
  screenSize: ScreenSize;
  maxVisible: number;
  totalTabs: number;
  hasOverflow: boolean;
}

// 默认配置
const DEFAULT_CONFIG: Required<UseAdaptiveNavigationConfig> = {
  tabs: [],
  strategy: 'priority',
  maxVisibleTabs: {
    small: 4,
    medium: 5,
    large: 6,
  },
  breakpoints: {
    small: 375,
    medium: 414,
  },
};

/**
 * 获取当前屏幕尺寸
 */
function useScreenSize(breakpoints: {
  small: number;
  medium: number;
}): ScreenSize {
  const [screenSize, setScreenSize] = useState<ScreenSize>('medium');

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width < breakpoints.small) {
        setScreenSize('small');
      } else if (width < breakpoints.medium) {
        setScreenSize('medium');
      } else {
        setScreenSize('large');
      }
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, [breakpoints]);

  return screenSize;
}

/**
 * 检查用户是否有访问标签页的权限
 */
function hasTabPermission(tab: TabConfig, user: unknown): boolean {
  if (!tab.requiredRole) return true;
  return hasRole(user as AuthUser | null, tab.requiredRole);
}

/**
 * 根据策略排序标签页
 */
function sortTabsByStrategy(
  tabs: TabConfig[],
  strategy: NavigationStrategy,
  user: unknown
): TabConfig[] {
  switch (strategy) {
    case 'priority': {
      return [...tabs].sort((a, b) => a.priority - b.priority);
    }

    case 'category': {
      // 按类别排序：core -> management -> admin
      const categoryOrder = { core: 1, management: 2, admin: 3 };
      return [...tabs].sort((a, b) => {
        const aOrder = categoryOrder[a.category || 'core'];
        const bOrder = categoryOrder[b.category || 'core'];
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.priority - b.priority;
      });
    }

    case 'role-based': {
      // 根据用户角色优化排序
      if (hasRole(user as AuthUser | null, 'admin')) {
        return [...tabs].sort((a, b) => a.priority - b.priority);
      } else if (hasRole(user as AuthUser | null, 'manager')) {
        // 经理用户优先显示管理功能
        return [...tabs].sort((a, b) => {
          if (a.category === 'management' && b.category !== 'management')
            return -1;
          if (b.category === 'management' && a.category !== 'management')
            return 1;
          return a.priority - b.priority;
        });
      } else {
        // 操作员用户优先显示核心功能
        return [...tabs].sort((a, b) => {
          if (a.category === 'core' && b.category !== 'core') return -1;
          if (b.category === 'core' && a.category !== 'core') return 1;
          return a.priority - b.priority;
        });
      }
    }

    default: {
      return tabs;
    }
  }
}

/**
 * 自适应导航 Hook
 */
export function useAdaptiveNavigation(
  config: UseAdaptiveNavigationConfig
): UseAdaptiveNavigationReturn {
  const { user } = useAuthStore();
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const screenSize = useScreenSize(mergedConfig.breakpoints);

  // 计算可用标签页
  const availableTabs = useMemo(() => {
    const filteredTabs = mergedConfig.tabs.filter(tab =>
      hasTabPermission(tab, user)
    );

    return sortTabsByStrategy(filteredTabs, mergedConfig.strategy, user);
  }, [mergedConfig.tabs, mergedConfig.strategy, user]);

  // 计算可见和溢出标签页
  const navigationResult = useMemo(() => {
    const maxVisible = mergedConfig.maxVisibleTabs[screenSize];
    const totalTabs = availableTabs.length;

    if (totalTabs <= maxVisible) {
      return {
        visibleTabs: availableTabs,
        overflowTabs: [],
        maxVisible,
        totalTabs,
        hasOverflow: false,
      };
    }

    // 为"更多"按钮预留空间
    const tabsToShow = maxVisible - 1;
    return {
      visibleTabs: availableTabs.slice(0, tabsToShow),
      overflowTabs: availableTabs.slice(tabsToShow),
      maxVisible,
      totalTabs,
      hasOverflow: true,
    };
  }, [availableTabs, screenSize, mergedConfig.maxVisibleTabs]);

  return {
    ...navigationResult,
    screenSize,
  };
}

/**
 * 导航分析 Hook - 用于调试和优化
 */
export function useNavigationAnalytics(tabs: TabConfig[]) {
  const { user } = useAuthStore();

  return useMemo(() => {
    const analytics = {
      totalTabs: tabs.length,
      availableByRole: {
        operator: tabs.filter(
          tab => !tab.requiredRole || tab.requiredRole === 'operator'
        ).length,
        manager: tabs.filter(
          tab =>
            !tab.requiredRole ||
            ['operator', 'manager'].includes(tab.requiredRole || 'operator')
        ).length,
        admin: tabs.length,
      },
      currentUserTabs: tabs.filter(tab => hasTabPermission(tab, user)).length,
      categories: {
        core: tabs.filter(tab => tab.category === 'core').length,
        management: tabs.filter(tab => tab.category === 'management').length,
        admin: tabs.filter(tab => tab.category === 'admin').length,
      },
    };

    // 开发环境输出分析信息
    if (import.meta.env.DEV) {
      console.log('📊 Navigation Analytics:', analytics);
    }

    return analytics;
  }, [tabs, user]);
}

export default useAdaptiveNavigation;
