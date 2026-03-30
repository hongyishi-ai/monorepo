/**
 * 忘记密码表单组件
 * 用于重置密码功能
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
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

// 忘记密码表单验证 Schema
const forgotPasswordSchema = z.object({
  email: z.string().min(1, '请输入邮箱地址').email('请输入有效的邮箱地址'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
  className?: string;
}

export function ForgotPasswordForm({
  onBackToLogin,
  className,
}: ForgotPasswordFormProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  // 使用旧认证系统获取认证操作
  const { resetPassword, isLoading, error, clearError } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      clearError();
      await resetPassword(data.email);
      setIsSuccess(true);
    } catch (error) {
      // 错误已经在 store 中处理
      console.error('重置密码失败:', error);
    }
  };

  const isFormLoading = isLoading || isSubmitting;

  if (isSuccess) {
    return (
      <div className={cn('w-full max-w-md space-y-6', className)}>
        <div className='text-center space-y-4'>
          <div className='mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center'>
            <Mail className='w-8 h-8 text-green-600' />
          </div>
          <h1 className='text-2xl font-bold text-gray-900'>重置邮件已发送</h1>
          <p className='text-sm text-gray-600'>
            我们已向 <strong>{getValues('email')}</strong> 发送了密码重置邮件。
            请检查您的邮箱并按照邮件中的说明重置密码。
          </p>
        </div>

        <div className='space-y-4'>
          <Button
            type='button'
            variant='outline'
            className='w-full'
            onClick={onBackToLogin}
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            返回登录
          </Button>

          <div className='text-center text-sm text-gray-600'>
            <p>
              没有收到邮件？请检查垃圾邮件文件夹，或
              <Button
                type='button'
                variant='link'
                size='sm'
                onClick={() => setIsSuccess(false)}
                className='text-blue-600 hover:text-blue-500 p-0 h-auto ml-1'
              >
                重新发送
              </Button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full max-w-md space-y-6', className)}>
      <div className='text-center space-y-2'>
        <h1 className='text-2xl font-bold text-gray-900'>重置密码</h1>
        <p className='text-sm text-gray-600'>
          请输入您的邮箱地址，我们将发送重置密码的链接
        </p>
      </div>

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

        <div className='space-y-3'>
          <Button type='submit' className='w-full' disabled={isFormLoading}>
            {isFormLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                发送中...
              </>
            ) : (
              '发送重置邮件'
            )}
          </Button>

          <Button
            type='button'
            variant='outline'
            className='w-full'
            onClick={onBackToLogin}
            disabled={isFormLoading}
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            返回登录
          </Button>
        </div>
      </form>
    </div>
  );
}
