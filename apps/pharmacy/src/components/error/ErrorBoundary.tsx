/**
 * 错误边界组件
 * 捕获和处理 React 组件错误，提供用户友好的错误界面
 */

import { AlertTriangle, Bug, Home, RefreshCw } from 'lucide-react';
import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { env, isDevelopment, isErrorReportingEnabled } from '@/lib/env';

export interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // 生成错误 ID
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 更新状态
    this.setState({
      error,
      errorInfo,
    });

    // 调用自定义错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 记录错误到控制台
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // 发送错误报告
    this.reportError(error, errorInfo);
  }

  // 发送错误报告
  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    if (!isErrorReportingEnabled) return;

    try {
      const errorReport = {
        id: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        appVersion: env.APP_VERSION,
        environment: env.APP_ENV,
      };

      // 发送到错误监控服务 (如 Sentry)
      if (env.SENTRY_DSN) {
        // 这里可以集成 Sentry 或其他错误监控服务
        console.log('Error report:', errorReport);
      }

      // 发送到自定义错误收集端点（仅当显式配置了错误收集URL）
      const errorReportUrl = (import.meta.env as Record<string, string>)
        .VITE_ERROR_REPORT_URL;
      if (errorReportUrl) {
        fetch(`${errorReportUrl}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorReport),
        }).catch(err => {
          console.warn('Failed to send error report:', err);
        });
      }
    } catch (reportError) {
      console.warn('Failed to report error:', reportError);
    }
  };

  // 重置错误状态
  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  // 刷新页面
  private handleRefresh = () => {
    window.location.reload();
  };

  // 返回首页
  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  // 复制错误信息
  private handleCopyError = () => {
    const { error, errorInfo, errorId } = this.state;

    const errorText = `
错误 ID: ${errorId}
时间: ${new Date().toISOString()}
应用版本: ${env.APP_VERSION}
环境: ${env.APP_ENV}

错误信息:
${error?.message}

错误堆栈:
${error?.stack}

组件堆栈:
${errorInfo?.componentStack}

用户代理:
${navigator.userAgent}

页面 URL:
${window.location.href}
    `.trim();

    navigator.clipboard
      .writeText(errorText)
      .then(() => {
        alert('错误信息已复制到剪贴板');
      })
      .catch(() => {
        // 降级方案
        const textArea = document.createElement('textarea');
        textArea.value = errorText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('错误信息已复制到剪贴板');
      });
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorId } = this.state;

      return (
        <div className='min-h-screen flex items-center justify-center bg-gray-50 p-4'>
          <Card className='w-full max-w-2xl'>
            <CardHeader className='text-center'>
              <div className='flex justify-center mb-4'>
                <AlertTriangle className='h-16 w-16 text-red-500' />
              </div>
              <CardTitle className='text-2xl text-red-600'>
                应用出现错误
              </CardTitle>
              <CardDescription>
                很抱歉，应用遇到了一个意外错误。我们已经记录了这个问题。
              </CardDescription>
            </CardHeader>

            <CardContent className='space-y-4'>
              <Alert>
                <Bug className='h-4 w-4' />
                <AlertDescription>
                  <strong>错误 ID:</strong> {errorId}
                  <br />
                  <strong>时间:</strong> {new Date().toLocaleString()}
                </AlertDescription>
              </Alert>

              {isDevelopment && error && (
                <div className='bg-gray-100 p-4 rounded-md'>
                  <h4 className='font-semibold text-sm mb-2'>开发信息:</h4>
                  <pre className='text-xs text-gray-700 whitespace-pre-wrap break-all'>
                    {error.message}
                  </pre>
                  {error.stack && (
                    <details className='mt-2'>
                      <summary className='cursor-pointer text-sm font-medium'>
                        查看堆栈跟踪
                      </summary>
                      <pre className='text-xs text-gray-600 mt-2 whitespace-pre-wrap break-all'>
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className='text-sm text-gray-600'>
                <p>您可以尝试以下操作来解决问题:</p>
                <ul className='list-disc list-inside mt-2 space-y-1'>
                  <li>刷新页面重新加载应用</li>
                  <li>返回首页继续使用其他功能</li>
                  <li>如果问题持续存在，请联系技术支持</li>
                </ul>
              </div>
            </CardContent>

            <CardFooter className='flex flex-col sm:flex-row gap-2'>
              <Button
                onClick={this.handleReset}
                variant='default'
                className='flex-1'
              >
                <RefreshCw className='h-4 w-4 mr-2' />
                重试
              </Button>

              <Button
                onClick={this.handleRefresh}
                variant='outline'
                className='flex-1'
              >
                <RefreshCw className='h-4 w-4 mr-2' />
                刷新页面
              </Button>

              <Button
                onClick={this.handleGoHome}
                variant='outline'
                className='flex-1'
              >
                <Home className='h-4 w-4 mr-2' />
                返回首页
              </Button>

              {isDevelopment && (
                <Button
                  onClick={this.handleCopyError}
                  variant='ghost'
                  size='sm'
                >
                  <Bug className='h-4 w-4 mr-2' />
                  复制错误信息
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
