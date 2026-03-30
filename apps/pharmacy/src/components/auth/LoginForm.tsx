/**
 * 登录表单组件
 * 使用 React Hook Form + Zod 进行表单验证
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
// 使用旧认证系统

// 登录表单验证 Schema
const loginSchema = z.object({
  email: z.string().min(1, '请输入邮箱地址').email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码').min(6, '密码至少需要6位字符'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
  className?: string;
}

export function LoginForm({
  onSuccess,
  onForgotPassword,
  className,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  // 使用旧认证系统获取认证状态和操作
  const { signIn, isLoading, error, clearError } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError();
      await signIn(data);
      reset();
      onSuccess?.();
    } catch (error) {
      // 错误已经在 store 中处理
      console.error('登录失败:', error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const isFormLoading = isLoading || isSubmitting;

  return (
    <div className={cn('w-full max-w-md space-y-6', className)}>
      <div className='text-center space-y-2'>
        <h1 className='text-2xl font-bold text-gray-900'>登录药房管理系统</h1>
        <p className='text-sm text-gray-600'>请输入您的账号信息进行登录</p>
      </div>

      {/* 调试信息 - 仅开发环境显示 */}
      {import.meta.env.DEV && (
        <div className='p-3 bg-blue-50 border border-blue-200 rounded-md'>
          <p className='text-sm text-blue-700'>
            🛠️ 开发模式：当前使用旧认证系统
          </p>
          <button
            type='button'
            onClick={() => {
              console.log('🔍 LoginForm 认证状态:', {
                signIn,
                isLoading,
                error,
              });
            }}
            className='mt-1 text-xs text-blue-600 underline'
          >
            查看认证状态
          </button>
        </div>
      )}

      {error && (
        <Alert variant='destructive'>
          <div className='flex items-center justify-between'>
            <span className='text-sm'>{error}</span>
            <Button
              variant='ghost'
              size='sm'
              onClick={clearError}
              className='h-auto p-1 text-destructive hover:text-destructive/80'
            >
              ×
            </Button>
          </div>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='email' className='text-sm font-medium'>
            邮箱地址 <span className='text-red-500'>*</span>
          </Label>
          <Input
            id='email'
            type='email'
            placeholder='请输入邮箱地址'
            autoComplete='email'
            disabled={isFormLoading}
            className={cn(
              'transition-colors',
              errors.email && 'border-red-500 focus-visible:ring-red-500'
            )}
            {...register('email')}
          />
          {errors.email && (
            <p className='text-sm text-red-500 mt-1'>{errors.email.message}</p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='password' className='text-sm font-medium'>
            密码 <span className='text-red-500'>*</span>
          </Label>
          <div className='relative'>
            <Input
              id='password'
              type={showPassword ? 'text' : 'password'}
              placeholder='请输入密码'
              autoComplete='current-password'
              disabled={isFormLoading}
              className={cn(
                'pr-10 transition-colors',
                errors.password && 'border-red-500 focus-visible:ring-red-500'
              )}
              {...register('password')}
            />
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
              onClick={togglePasswordVisibility}
              disabled={isFormLoading}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className='h-4 w-4 text-gray-500' />
              ) : (
                <Eye className='h-4 w-4 text-gray-500' />
              )}
              <span className='sr-only'>
                {showPassword ? '隐藏密码' : '显示密码'}
              </span>
            </Button>
          </div>
          {errors.password && (
            <p className='text-sm text-red-500 mt-1'>
              {errors.password.message}
            </p>
          )}
        </div>

        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <input
              id='remember'
              type='checkbox'
              className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
            />
            <Label htmlFor='remember' className='text-sm text-gray-600'>
              记住我
            </Label>
          </div>

          {onForgotPassword && (
            <Button
              type='button'
              variant='link'
              size='sm'
              onClick={onForgotPassword}
              className='text-sm text-blue-600 hover:text-blue-500 p-0 h-auto'
            >
              忘记密码？
            </Button>
          )}
        </div>

        <Button type='submit' className='w-full' disabled={isFormLoading}>
          {isFormLoading ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              登录中...
            </>
          ) : (
            '登录'
          )}
        </Button>
      </form>

      <div className='text-center text-sm text-gray-600'>
        <p>还没有账号？请联系管理员开通账户</p>
      </div>
    </div>
  );
}
