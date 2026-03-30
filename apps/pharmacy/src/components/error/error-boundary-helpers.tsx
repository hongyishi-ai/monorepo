/**
 * 错误边界相关的辅助组件
 */

import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';
import React from 'react';

import { ErrorBoundary } from './ErrorBoundary';

import { Alert, AlertDescription } from '@/components/ui/alert';

// 页面级错误边界
export const PageErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => (
  <ErrorBoundary
    onError={(error, errorInfo) => {
      console.error('Page Error:', error, errorInfo);
    }}
  >
    {children}
  </ErrorBoundary>
);

// 组件级错误边界
export const ComponentErrorBoundary: React.FC<{
  children: ReactNode;
  componentName?: string;
}> = ({ children, componentName }) => (
  <ErrorBoundary
    onError={(error, errorInfo) => {
      console.error(`Component Error (${componentName}):`, error, errorInfo);
    }}
    fallback={
      <Alert>
        <AlertTriangle className='h-4 w-4' />
        <AlertDescription>
          {componentName ? `${componentName} 组件` : '组件'}
          加载失败，请刷新页面重试。
        </AlertDescription>
      </Alert>
    }
  >
    {children}
  </ErrorBoundary>
);
