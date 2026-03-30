import {
  BarChart3,
  Home,
  LogOut,
  Menu,
  Package,
  QrCode,
  Users,
  X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { EnhancedMobileNavigation } from '@/components/navigation/EnhancedMobileNavigation';
import { ToastContainer } from '@/components/ui/alert-toast';
import { Button } from '@/components/ui/button';
// 使用旧认证系统
import { useAuthStore } from '@/stores/auth.store';
import {
  formatUserDisplayName,
  getUserRoleLabel,
  hasRole,
} from '@/utils/auth-utils';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

/**
 * 应用布局组件
 * 提供响应式布局，包括顶部导航栏和侧边菜单
 */
export function AppLayout({
  children,
  title = '药房库存管理系统',
}: AppLayoutProps) {
  // 使用旧认证系统获取认证状态
  const { user, signOut } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('退出登录失败:', error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // 基础菜单项（所有用户都可见）
  const baseMenuItems = [
    { path: '/dashboard', label: '仪表板', icon: <Home className='h-5 w-5' /> },
    {
      path: '/inventory-operation',
      label: '出/入库',
      icon: <QrCode className='h-5 w-5' />,
    },
    {
      path: '/inventory',
      label: '库存查询',
      icon: <Package className='h-5 w-5' />,
    },
  ];

  // 根据用户角色构建菜单项
  const menuItems = [...baseMenuItems];

  // 经理和管理员可见的菜单项
  if (hasRole(user, 'manager')) {
    menuItems.push(
      {
        path: '/medicines',
        label: '药品管理',
        icon: <Package className='h-5 w-5' />,
      },
      {
        path: '/reports',
        label: '报表中心',
        icon: <BarChart3 className='h-5 w-5' />,
      }
    );
  }

  // 仅管理员可见的菜单项
  if (hasRole(user, 'admin')) {
    menuItems.push({
      path: '/users',
      label: '用户管理',
      icon: <Users className='h-5 w-5' />,
    });
  }

  // 开发环境调试信息
  if (import.meta.env.DEV) {
    console.log('🏗️ AppLayout 状态:', {
      user: user?.email,
      permissions: {
        isAdmin: hasRole(user, 'admin'),
        isManager: hasRole(user, 'manager'),
        isOperator: hasRole(user, 'operator'),
      },
      menuItemsCount: menuItems.length,
    });
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col'>
      {/* 顶部导航栏 - Brooklyn 极简：白底+描边+微阴影 */}
      <header className='bg-white/95 border-b border-slate-200 sticky top-0 z-30 shadow-[0_1px_0_#0000000a,0_2px_12px_#0000000a]'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            <div className='flex items-center'>
              <button
                className='md:hidden mr-3 p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200'
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? '关闭菜单' : '打开菜单'}
              >
                {isMobileMenuOpen ? (
                  <X className='h-5 w-5' />
                ) : (
                  <Menu className='h-5 w-5' />
                )}
              </button>
              <div className='flex items-center space-x-3'>
                <div className='w-8 h-8 rounded-lg flex items-center justify-center bg-white ring-1 ring-inset ring-slate-200 shadow-sm'>
                  <span className='text-slate-900 text-sm font-bold'>药</span>
                </div>
                <h1 className='text-xl font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-none'>
                  {title}
                </h1>
              </div>
            </div>

            <div className='flex items-center space-x-4'>
              <div className='hidden sm:flex items-center space-x-3'>
                <div className='text-right'>
                  <div className='text-sm font-medium text-slate-700'>
                    {formatUserDisplayName(user!)}
                  </div>
                  <div className='text-xs text-slate-500'>
                    {user?.role ? getUserRoleLabel(user.role) : '加载中...'}
                  </div>
                </div>
                <div className='w-8 h-8 rounded-full flex items-center justify-center bg-white ring-1 ring-inset ring-slate-200 shadow-sm'>
                  <span className='text-slate-900 text-xs font-medium'>
                    {formatUserDisplayName(user!).charAt(0)}
                  </span>
                </div>
              </div>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleSignOut}
                className='text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all duration-200'
              >
                <LogOut className='h-4 w-4 mr-2' />
                <span className='hidden sm:inline'>退出</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className='flex flex-1'>
        {/* 移动端侧边菜单 - 磨砂玻璃效果 */}
        <div
          className={`fixed inset-0 z-20 transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <div
            className='absolute inset-0 bg-slate-900/20 backdrop-blur-sm'
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className='fixed inset-y-0 left-0 max-w-xs w-full bg-white/95 shadow-2xl flex flex-col border-r border-slate-200'>
            <div className='p-4 border-b border-white/20 flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <div className='w-6 h-6 rounded-md flex items-center justify-center bg-white ring-1 ring-inset ring-slate-200 shadow-sm'>
                  <span className='text-slate-900 text-xs font-bold'>药</span>
                </div>
                <div className='font-medium text-lg text-slate-900'>菜单</div>
              </div>
              <button
                className='p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200'
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className='h-5 w-5' />
              </button>
            </div>
            <div className='flex-1 overflow-y-auto p-4'>
              <nav className='space-y-1'>
                {menuItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${isActive(item.path) ? 'text-blue-700 bg-white ring-1 ring-inset ring-blue-200/70 shadow-sm' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div
                      className={`${isActive(item.path) ? 'text-blue-600' : 'text-slate-500'}`}
                    >
                      {item.icon}
                    </div>
                    <span className='ml-3 font-medium'>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
            <div className='p-4 border-t border-white/20'>
              <div className='flex items-center space-x-3'>
                <div className='w-8 h-8 rounded-full flex items-center justify-center bg-white ring-1 ring-inset ring-slate-200 shadow-sm'>
                  <span className='text-slate-900 text-xs font-medium'>
                    {formatUserDisplayName(user!).charAt(0)}
                  </span>
                </div>
                <div>
                  <div className='text-sm font-medium text-slate-900'>
                    {formatUserDisplayName(user!)}
                  </div>
                  <div className='text-xs text-slate-500'>
                    {user?.role ? getUserRoleLabel(user.role) : '加载中...'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 桌面端侧边菜单 - 磨砂玻璃效果 */}
        <div className='hidden md:flex md:flex-shrink-0'>
          <div className='flex flex-col w-64 bg-white/95 border-r border-slate-200'>
            <div className='flex-1 flex flex-col pt-6 pb-4 overflow-y-auto'>
              <div className='px-4 mb-6'>
                <div className='flex items-center space-x-3'>
                  <div className='w-8 h-8 rounded-lg flex items-center justify-center bg-white ring-1 ring-inset ring-slate-200 shadow-sm'>
                    <span className='text-slate-900 text-sm font-bold'>药</span>
                  </div>
                  <div className='text-lg font-semibold text-slate-900'>
                    药品管理
                  </div>
                </div>
              </div>
              <nav className='flex-1 px-4 space-y-1'>
                {menuItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${isActive(item.path) ? 'text-blue-700 bg-white ring-1 ring-inset ring-blue-200/70 shadow-sm' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'}`}
                  >
                    <div
                      className={`${isActive(item.path) ? 'text-blue-600' : 'text-slate-500'}`}
                    >
                      {item.icon}
                    </div>
                    <span className='ml-3'>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* 主内容区域 */}
        <div className='flex-1 overflow-auto'>
          <main className='w-full max-w-none px-2 sm:px-4 lg:px-6 py-4 sm:py-6 pb-20 md:pb-6'>
            <div className='bg-white rounded-2xl p-3 sm:p-6 shadow-[0_1px_0_#0000000a,0_1px_6px_#0000000a] border border-slate-200'>
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* 移动端底部导航 - 使用增强版自适应导航 */}
      <EnhancedMobileNavigation strategy='priority' />
      {/* 全局 Toast 容器 */}
      <ToastContainer />
    </div>
  );
}
