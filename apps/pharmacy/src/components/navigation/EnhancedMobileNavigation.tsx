/**
 * 增强版移动端底部导航组件
 * 使用自适应导航 Hook，支持多种导航策略和响应式布局
 */

import {
  BarChart3,
  ChevronUp,
  Home,
  MoreHorizontal,
  Package,
  QrCode,
  Users,
} from 'lucide-react';
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import type {
  NavigationStrategy,
  TabConfig,
} from '@/hooks/useAdaptiveNavigation';
import {
  useAdaptiveNavigation,
  useNavigationAnalytics,
} from '@/hooks/useAdaptiveNavigation';

// 标签页配置
const NAVIGATION_TABS: TabConfig[] = [
  {
    path: '/dashboard',
    label: '首页',
    icon: <Home className='h-5 w-5' />,
    priority: 1,
    category: 'core',
  },
  {
    path: '/inventory-operation',
    label: '出/入库',
    icon: <QrCode className='h-5 w-5' />,
    priority: 2,
    category: 'core',
  },
  {
    path: '/inventory',
    label: '库存',
    icon: <Package className='h-5 w-5' />,
    priority: 3,
    category: 'core',
  },
  {
    path: '/medicines',
    label: '药品',
    icon: <Package className='h-5 w-5' />,
    priority: 4,
    category: 'management',
    requiredRole: 'manager',
  },
  {
    path: '/reports',
    label: '报表',
    icon: <BarChart3 className='h-5 w-5' />,
    priority: 5,
    category: 'management',
    requiredRole: 'manager',
  },
  {
    path: '/users',
    label: '用户',
    icon: <Users className='h-5 w-5' />,
    priority: 7,
    category: 'admin',
    requiredRole: 'admin',
  },
];

interface EnhancedMobileNavigationProps {
  className?: string;
  strategy?: NavigationStrategy;
  showAnalytics?: boolean;
}

export const EnhancedMobileNavigation: React.FC<
  EnhancedMobileNavigationProps
> = ({ className = '', strategy = 'priority', showAnalytics = false }) => {
  const location = useLocation();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // 使用自适应导航 Hook
  const {
    visibleTabs,
    overflowTabs,
    screenSize,
    maxVisible,
    totalTabs,
    hasOverflow,
  } = useAdaptiveNavigation({
    tabs: NAVIGATION_TABS,
    strategy,
    maxVisibleTabs: {
      small: 4,
      medium: 5,
      large: 5, // 移动端最多5个
    },
  });

  // 导航分析（开发环境）
  const analytics = useNavigationAnalytics(NAVIGATION_TABS);

  // 检查当前路径是否激活
  const isActive = (path: string) => location.pathname === path;

  // 检查是否有激活的溢出标签页
  const hasActiveOverflowTab = overflowTabs.some(tab => isActive(tab.path));

  // 渲染单个标签页
  const renderTab = (tab: TabConfig, isInOverflow = false) => {
    const active = isActive(tab.path);
    return (
      <Link
        key={tab.path}
        to={tab.path}
        role='tab'
        aria-current={active ? 'page' : undefined}
        className={`relative flex flex-col items-center justify-center rounded-xl transition-all duration-200 ${
          active
            ? 'text-blue-600 bg-white/90 ring-1 ring-inset ring-blue-200/70 shadow-sm'
            : 'text-slate-700 hover:text-slate-900 hover:bg-white/70'
        } ${isInOverflow ? 'p-3 min-h-[60px]' : 'p-2'}`}
        onClick={() => setIsMoreMenuOpen(false)}
      >
        {/* 顶部激活指示条 */}
        {active && (
          <span className='absolute top-0 left-3 right-3 h-0.5 rounded-full bg-blue-500/80' />
        )}
        <div className='flex flex-col items-center'>
          {/* 统一图标尺寸 */}
          <div className={`h-5 w-5 ${active ? 'text-blue-600' : ''}`}>
            {tab.icon}
          </div>
          <span
            className={`mt-1 font-medium ${isInOverflow ? 'text-sm' : 'text-[11px]'}`}
          >
            {tab.label}
          </span>
        </div>
      </Link>
    );
  };

  // 渲染"更多"按钮
  const renderMoreButton = () => (
    <button
      className={`relative flex flex-col items-center justify-center rounded-xl transition-all duration-200 p-2 ${
        hasActiveOverflowTab || isMoreMenuOpen
          ? 'text-blue-600 bg-white/90 ring-1 ring-inset ring-blue-200/70 shadow-sm'
          : 'text-slate-700 hover:text-slate-900 hover:bg-white/70'
      }`}
      onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
      aria-label={`更多选项 (${overflowTabs.length})`}
    >
      {(hasActiveOverflowTab || isMoreMenuOpen) && (
        <span className='absolute top-0 left-3 right-3 h-0.5 rounded-full bg-blue-500/80' />
      )}
      <div className='flex flex-col items-center'>
        <MoreHorizontal className='h-5 w-5' />
        <span className='text-[11px] mt-1 font-medium'>更多</span>
      </div>

      {/* 溢出标签页数量指示器 */}
      {overflowTabs.length > 0 && (
        <div className='absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center'>
          {overflowTabs.length}
        </div>
      )}
    </button>
  );

  // 开发环境显示分析信息
  if (showAnalytics && import.meta.env.DEV) {
    console.log('📱 Mobile Navigation State:', {
      screenSize,
      maxVisible,
      totalTabs,
      visibleCount: visibleTabs.length,
      overflowCount: overflowTabs.length,
      strategy,
      analytics,
    });
  }

  return (
    <>
      {/* 底部导航栏 */}
      <nav
        aria-label='底部导航'
        className={`md:hidden fixed bottom-0 left-0 right-0 backdrop-blur-xl bg-white/95 border-t border-white/30 z-10 shadow-[0_-1px_0_#0000000a,0_-4px_24px_#00000014] ${className}`}
      >
        <div
          className={`grid h-16 px-2 gap-1`}
          style={{
            gridTemplateColumns: `repeat(${visibleTabs.length + (hasOverflow ? 1 : 0)}, 1fr)`,
          }}
        >
          {/* 可见标签页 */}
          {visibleTabs.map(tab => renderTab(tab))}

          {/* "更多"按钮 */}
          {hasOverflow && renderMoreButton()}
        </div>
      </nav>

      {/* 更多菜单覆盖层 */}
      {isMoreMenuOpen && hasOverflow && (
        <div className='md:hidden fixed inset-0 z-20'>
          {/* 背景遮罩 */}
          <div
            className='absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300'
            onClick={() => setIsMoreMenuOpen(false)}
          />

          {/* 更多菜单内容 - 从底部滑入 */}
          <div className='fixed bottom-16 left-0 right-0 backdrop-blur-xl bg-white/95 border-t border-white/20 shadow-2xl transform transition-transform duration-300 ease-out'>
            <div className='p-4'>
              {/* 菜单头部 */}
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center space-x-2'>
                  <h3 className='text-lg font-medium text-slate-800'>
                    更多功能
                  </h3>
                  <span className='text-sm text-slate-500'>
                    ({overflowTabs.length})
                  </span>
                </div>
                <button
                  className='p-2 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-white/60 transition-all duration-200'
                  onClick={() => setIsMoreMenuOpen(false)}
                  aria-label='关闭更多菜单'
                >
                  <ChevronUp className='h-5 w-5' />
                </button>
              </div>

              {/* 溢出标签页网格 */}
              <div
                className={`grid gap-2 ${
                  overflowTabs.length <= 2
                    ? 'grid-cols-2'
                    : overflowTabs.length <= 3
                      ? 'grid-cols-3'
                      : 'grid-cols-2'
                }`}
              >
                {overflowTabs.map(tab => renderTab(tab, true))}
              </div>

              {/* 开发环境调试信息 */}
              {showAnalytics && import.meta.env.DEV && (
                <div className='mt-4 p-3 bg-slate-100 rounded-lg text-xs text-slate-600'>
                  <div>
                    屏幕: {screenSize} | 策略: {strategy}
                  </div>
                  <div>
                    可见: {visibleTabs.length} | 溢出: {overflowTabs.length}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EnhancedMobileNavigation;
