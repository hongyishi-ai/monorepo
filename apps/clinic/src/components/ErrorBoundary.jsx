// src/components/ErrorBoundary.jsx
import React from "react";
import { debounce } from 'lodash';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorCount: 0
    };

    // 防抖处理错误上报
    this.debouncedLogError = debounce(this.logErrorToService, 1000);
    
    // 性能监控
    this.startTime = Date.now();
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true, 
      error,
      errorCount: prevState => prevState.errorCount + 1
    };
  }

  componentDidCatch(error, errorInfo) {
    // 使用批量更新优化性能
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));
    
    // 防抖处理错误上报
    this.debouncedLogError(error, errorInfo);

    // 记录性能指标
    this.logPerformanceMetrics();
  }

  logPerformanceMetrics() {
    const endTime = Date.now();
    const timeToError = endTime - this.startTime;
    
    // 记录性能指标
    console.log('错误处理性能指标:', {
      timeToError,
      errorCount: this.state.errorCount,
      memoryUsage: performance.memory?.usedJSHeapSize
    });
  }

  logErrorToService(error, errorInfo) {
    const errorLog = {
      error: error.toString(),
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      performanceMetrics: {
        memory: performance.memory?.usedJSHeapSize,
        errorCount: this.state.errorCount
      }
    };

    // 使用 requestIdleCallback 在空闲时间发送错误日志
    requestIdleCallback(() => {
      console.log("错误日志：", errorLog);
    });
  }

  handleRetry = () => {
    // 使用函数式更新确保状态一致性
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: prevState.errorCount
    }));
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            抱歉，出现了一些问题
          </h2>
          <div className="text-gray-600 mb-4">
            {this.state.error && this.state.error.toString()}
          </div>
          <Button 
            onClick={this.handleRetry}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            重试
          </Button>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 p-4 bg-gray-100 rounded">
              <summary className="cursor-pointer">错误详情</summary>
              <pre className="mt-2 text-sm">
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// 使用 memo 包装导出的组件
export default React.memo(ErrorBoundary, (prevProps, nextProps) => {
  // 自定义比较逻辑，只在必要时重新渲染
  return prevProps.children === nextProps.children;
});
