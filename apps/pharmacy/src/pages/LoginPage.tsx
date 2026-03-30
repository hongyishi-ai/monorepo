/**
 * 登录页面组件
 * 提供用户登录界面和忘记密码功能
 */

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuthStore } from '@/stores/auth.store';
// 使用旧认证系统

export function LoginPage() {
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  // 使用旧认证系统获取认证状态
  const { isAuthenticated, isInitializing } = useAuthStore();

  // 获取重定向路径
  const from = location.state?.from?.pathname || '/dashboard';

  // 如果已经登录，重定向到目标页面
  useEffect(() => {
    if (isAuthenticated && !isInitializing) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isInitializing, navigate, from]);

  const handleLoginSuccess = () => {
    navigate(from, { replace: true });
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
  };

  // 如果正在初始化或已经登录，显示加载状态
  if (isInitializing || isAuthenticated) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-2 text-sm text-gray-600'>正在加载...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex'>
      {/* 左侧背景区域 */}
      <div className='hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 relative overflow-hidden'>
        <div className='absolute inset-0 bg-black/20'></div>
        <div className='relative z-10 flex flex-col justify-center px-12 text-white'>
          <div className='max-w-md'>
            <h1 className='text-4xl font-bold mb-6'>药房库存管理系统</h1>
            <p className='text-xl mb-8 text-blue-100'>
              高效管理药品库存，确保药品安全和合规使用
            </p>
            <div className='space-y-4'>
              <div className='flex items-center space-x-3'>
                <div className='w-2 h-2 bg-white rounded-full'></div>
                <span className='text-blue-100'>扫码快速入库出库</span>
              </div>
              <div className='flex items-center space-x-3'>
                <div className='w-2 h-2 bg-white rounded-full'></div>
                <span className='text-blue-100'>批次管理和效期提醒</span>
              </div>
              <div className='flex items-center space-x-3'>
                <div className='w-2 h-2 bg-white rounded-full'></div>
                <span className='text-blue-100'>库存统计和报表分析</span>
              </div>
            </div>
          </div>
        </div>

        {/* 装饰性图案 */}
        <div className='absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32'></div>
        <div className='absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24'></div>
      </div>

      {/* 右侧登录区域 */}
      <div className='flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50'>
        <div className='w-full max-w-md'>
          {showForgotPassword ? (
            <ForgotPasswordForm
              onBackToLogin={handleBackToLogin}
              className='bg-white p-8 rounded-lg shadow-lg'
            />
          ) : (
            <div className='bg-white p-8 rounded-lg shadow-lg'>
              <LoginForm
                onSuccess={handleLoginSuccess}
                onForgotPassword={handleForgotPassword}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
