/**
 * 自适应移动端底部导航组件
 * 支持基于权限的动态标签页数量，使用"更多"菜单处理溢出
 */

import {
  BarChart3,
  Home,
  MoreHorizontal,
  Package,
  QrCode,
  Users,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useAuthStore } from '@/stores/auth.store';
import type { UserRole } from '@/types/auth';
import { hasRole } from '@/utils/auth-utils';

// 标签页配置接口
interface TabConfig {
  path: string;
  label: string;
  icon: React.ReactNode;
  priority: number; // 1 = 最高优先级
  requiredRole?: UserRole;
}

// 标签页配置 - 按优先级排序
const TAB_CONFIGS: TabConfig[] = [
  {
    path: '/dashboard',
    label: '首页',
    icon: <Home className='h-5 w-5' />,
    priority: 1,
  },
  {
    path: '/inventory-operation',
    label: '出/入库',
    icon: <QrCode className='h-5 w-5' />,
    priority: 2,
  },
  {
    path: '/inventory',
    label: '库存',
    icon: <Package className='h-5 w-5' />,
    priority: 3,
  },
  {
    path: '/medicines',
    label: '药品',
    icon: <Package className='h-5 w-5' />,
    priority: 4,
    requiredRole: 'manager',
  },
  {
    path: '/reports',
    label: '报表',
    icon: <BarChart3 className='h-5 w-5' />,
    priority: 5,
    requiredRole: 'manager',
  },
  {
    path: '/users',
    label: '用户',
    icon: <Users className='h-5 w-5' />,
    priority: 6,
    requiredRole: 'admin',
  },
];

// 响应式配置
const RESPONSIVE_CONFIG = {
  maxVisibleTabs: {
    small: 4, // <375px
    medium: 5, // 375-414px
    large: 5, // >414px
  },
  breakpoints: {
    small: 375,
    medium: 414,
  },
};

interface MobileBottomNavigationProps {
  className?: string;
}

export const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({
  className = '',
}) => {
  const { user } = useAuthStore();
  const location = useLocation();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // 检查当前路径是否激活
  const isActive = (path: string) => location.pathname === path;

  // 根据用户权限过滤可见标签页
  const availableTabs = useMemo(() => {
    return TAB_CONFIGS.filter(tab => {
      if (!tab.requiredRole) return true;
      return hasRole(user, tab.requiredRole);
    }).sort((a, b) => a.priority - b.priority);
  }, [user]);

  // 计算可见标签页和溢出标签页
  const { visibleTabs, overflowTabs } = useMemo(() => {
    // 简化版响应式逻辑 - 可以后续增强
    const maxVisible = RESPONSIVE_CONFIG.maxVisibleTabs.medium;

    if (availableTabs.length <= maxVisible) {
      return {
        visibleTabs: availableTabs,
        overflowTabs: [],
      };
    }

    // 如果需要"更多"按钮，为其预留空间
    const tabsToShow = maxVisible - 1;
    return {
      visibleTabs: availableTabs.slice(0, tabsToShow),
      overflowTabs: availableTabs.slice(tabsToShow),
    };
  }, [availableTabs]);

  // 检查是否有激活的溢出标签页
  const hasActiveOverflowTab = overflowTabs.some(tab => isActive(tab.path));

  // 渲染单个标签页
  const renderTab = (tab: TabConfig, isInOverflow = false) => (
    <Link
      key={tab.path}
      to={tab.path}
      className={`flex flex-col items-center justify-center rounded-xl transition-all duration-200 ${
        isActive(tab.path)
          ? 'text-blue-600 bg-blue-50/80'
          : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
      } ${isInOverflow ? 'p-3' : 'p-2'}`}
      onClick={() => setIsMoreMenuOpen(false)}
    >
      {tab.icon}
      <span className='text-xs mt-1 font-medium'>{tab.label}</span>
    </Link>
  );

  // 渲染"更多"按钮
  const renderMoreButton = () => (
    <button
      className={`flex flex-col items-center justify-center rounded-xl transition-all duration-200 p-2 ${
        hasActiveOverflowTab || isMoreMenuOpen
          ? 'text-blue-600 bg-blue-50/80'
          : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
      }`}
      onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
      aria-label='更多选项'
    >
      <MoreHorizontal className='h-5 w-5' />
      <span className='text-xs mt-1 font-medium'>更多</span>
    </button>
  );

  return (
    <>
      {/* 底部导航栏 */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 backdrop-blur-xl bg-white/90 border-t border-white/20 z-10 shadow-lg ${className}`}
      >
        <div
          className={`grid h-16 px-2`}
          style={{
            gridTemplateColumns: `repeat(${visibleTabs.length + (overflowTabs.length > 0 ? 1 : 0)}, 1fr)`,
          }}
        >
          {/* 可见标签页 */}
          {visibleTabs.map(tab => renderTab(tab))}

          {/* "更多"按钮 */}
          {overflowTabs.length > 0 && renderMoreButton()}
        </div>
      </div>

      {/* 更多菜单覆盖层 */}
      {isMoreMenuOpen && overflowTabs.length > 0 && (
        <div className='md:hidden fixed inset-0 z-20 transition-opacity duration-300'>
          {/* 背景遮罩 */}
          <div
            className='absolute inset-0 bg-slate-900/20 backdrop-blur-sm'
            onClick={() => setIsMoreMenuOpen(false)}
          />

          {/* 更多菜单内容 */}
          <div className='fixed bottom-16 left-0 right-0 backdrop-blur-xl bg-white/95 border-t border-white/20 shadow-2xl'>
            <div className='p-4'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-medium text-slate-800'>更多功能</h3>
                <button
                  className='p-2 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-white/60 transition-all duration-200'
                  onClick={() => setIsMoreMenuOpen(false)}
                  aria-label='关闭更多菜单'
                >
                  <X className='h-5 w-5' />
                </button>
              </div>

              {/* 溢出标签页网格 */}
              <div className='grid grid-cols-3 gap-2'>
                {overflowTabs.map(tab => renderTab(tab, true))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileBottomNavigation;
