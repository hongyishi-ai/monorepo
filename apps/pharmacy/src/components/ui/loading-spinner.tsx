/**
 * 加载动画组件
 * 用于页面懒加载时的占位显示
 */

import React from 'react';

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  text = '正在加载...',
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='text-center'>
        <div
          className={cn(
            'animate-spin rounded-full border-b-2 border-blue-600 mx-auto',
            sizeClasses[size],
            className
          )}
        />
        {text && <p className='mt-2 text-sm text-gray-600'>{text}</p>}
      </div>
    </div>
  );
};

// 页面级别的加载组件
export const PageLoader: React.FC<{ text?: string }> = ({ text }) => (
  <LoadingSpinner size='lg' text={text} />
);

// 组件级别的加载组件
export const ComponentLoader: React.FC<{
  text?: string;
  className?: string;
}> = ({ text, className }) => (
  <div className={cn('flex items-center justify-center p-4', className)}>
    <LoadingSpinner size='sm' text={text} />
  </div>
);

// 内联加载组件
export const InlineLoader: React.FC = () => (
  <div className='inline-flex items-center'>
    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600' />
  </div>
);
