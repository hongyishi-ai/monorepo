/**
 * CRITICAL: useLayoutEffect polyfill must be applied FIRST
 * This fixes the vendor bundle error: Cannot read properties of undefined (reading 'useLayoutEffect')
 */

// Import React first to ensure it's available
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Optional: Apply React polyfills in production only when explicitly enabled
// Default is disabled to avoid masking build issues
if (
  import.meta.env.PROD &&
  import.meta.env.VITE_ENABLE_REACT_POLYFILLS === 'true'
) {
  (function applyReactPolyfills() {
    try {
      console.log(
        '🔧 Applying React polyfills for production vendor bundle...'
      );

      // Core React APIs that must be available
      const requiredReactAPIs = [
        'createContext',
        'useContext',
        'useState',
        'useEffect',
        'useLayoutEffect',
        'useCallback',
        'useMemo',
        'useRef',
        'useReducer',
        'createElement',
        'Fragment',
        'Component',
        'PureComponent',
        'memo',
        'forwardRef',
        'createRef',
        'isValidElement',
      ];

      // Fix for React instance
      if (React && React.useEffect) {
        const missingAPIs: string[] = [];

        // Check for missing APIs
        requiredReactAPIs.forEach(api => {
          if (typeof (React as Record<string, unknown>)[api] === 'undefined') {
            missingAPIs.push(api);
          }
        });

        if (missingAPIs.length > 0) {
          console.warn('⚠️ Missing React APIs detected:', missingAPIs);
        }

        // Apply useLayoutEffect polyfill if missing
        if (typeof React.useLayoutEffect === 'undefined') {
          (
            React as typeof React & { useLayoutEffect?: typeof React.useEffect }
          ).useLayoutEffect = React.useEffect;
          console.log('✅ useLayoutEffect polyfill applied to React');
        }

        // Apply createContext polyfill if missing (critical for production)
        if (
          typeof (React as Record<string, unknown>).createContext ===
          'undefined'
        ) {
          console.error(
            '🚨 CRITICAL: React.createContext is undefined - applying emergency polyfill'
          );
          // Emergency polyfill for createContext
          (React as Record<string, unknown>).createContext = function (
            defaultValue: unknown
          ) {
            const context = {
              Provider: ({
                children,
              }: {
                children: React.ReactNode;
                value?: unknown;
              }) => children,
              Consumer: ({
                children,
              }: {
                children: (value: unknown) => React.ReactNode;
              }) => children(defaultValue),
              _currentValue: defaultValue,
              _defaultValue: defaultValue,
            };
            return context;
          };
          console.log('✅ Emergency createContext polyfill applied');
        }
      }

      // Fix for global React (for vendor bundles)
      if (typeof window !== 'undefined') {
        const globalReact = (window as typeof window & { React?: typeof React })
          .React;
        if (globalReact && globalReact.useEffect) {
          // Apply same polyfills to global React
          if (typeof globalReact.useLayoutEffect === 'undefined') {
            globalReact.useLayoutEffect = globalReact.useEffect;
            console.log('✅ useLayoutEffect polyfill applied to global React');
          }

          if (
            typeof (globalReact as Record<string, unknown>).createContext ===
            'undefined'
          ) {
            console.error(
              '🚨 CRITICAL: Global React.createContext is undefined - applying emergency polyfill'
            );
            (globalReact as Record<string, unknown>).createContext = function (
              defaultValue: unknown
            ) {
              const context = {
                Provider: ({
                  children,
                }: {
                  children: React.ReactNode;
                  value?: unknown;
                }) => children,
                Consumer: ({
                  children,
                }: {
                  children: (value: unknown) => React.ReactNode;
                }) => children(defaultValue),
                _currentValue: defaultValue,
                _defaultValue: defaultValue,
              };
              return context;
            };
            console.log(
              '✅ Emergency createContext polyfill applied to global React'
            );
          }
        }

        // Set global markers for debugging
        (
          window as typeof window & {
            __USE_LAYOUT_EFFECT_POLYFILL_APPLIED__?: boolean;
            __REACT_POLYFILLS_APPLIED__?: boolean;
          }
        ).__USE_LAYOUT_EFFECT_POLYFILL_APPLIED__ = true;
        (
          window as typeof window & {
            __USE_LAYOUT_EFFECT_POLYFILL_APPLIED__?: boolean;
            __REACT_POLYFILLS_APPLIED__?: boolean;
          }
        ).__REACT_POLYFILLS_APPLIED__ = true;
      }

      console.log('✅ React polyfills application completed');
    } catch (error) {
      console.error('❌ Failed to apply React polyfills:', error);
    }
  })();
} else {
  console.log(
    '🔧 Development mode: Skipping React polyfills to prevent interference with hot reload'
  );
}

import App from './App.tsx';
import { ErrorBoundary } from './components/error/ErrorBoundary';
import { env, isDevelopment, isPerformanceMonitoringEnabled } from './lib/env';
import { initializeProductionAuth } from './lib/production-auth-fix';
import { initializeProductionEnvironment } from './lib/production-config';
import { queryPerformanceMonitor } from './lib/query-client';
import { QueryProvider } from './providers/QueryProvider';

import './index.css';

// 初始化性能监控
if (isPerformanceMonitoringEnabled) {
  if (isDevelopment) {
    // 开发环境启用详细的查询性能监控
    queryPerformanceMonitor.monitorSlowQueries(1000); // 1秒阈值
    queryPerformanceMonitor.monitorMemoryUsage(30000); // 30秒间隔
  } else {
    // 生产环境启用基础性能监控
    queryPerformanceMonitor.monitorSlowQueries(2000); // 2秒阈值
    queryPerformanceMonitor.monitorMemoryUsage(60000); // 60秒间隔
  }
}

// 开发环境下输出应用信息
if (isDevelopment) {
  console.log(`🚀 ${env.APP_NAME} v${env.APP_VERSION}`);
  console.log(`📦 Environment: ${env.APP_ENV}`);
  console.log(`🔧 Node Environment: ${env.NODE_ENV}`);
}

// 初始化应用
async function initializeApp() {
  // 在生产环境中初始化
  if (!isDevelopment) {
    try {
      // 1. 初始化生产环境配置
      await initializeProductionEnvironment();

      // 2. 初始化认证
      await initializeProductionAuth();
    } catch (error) {
      console.error('生产环境初始化失败:', error);
    }
  }

  // 渲染应用
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <QueryProvider>
          <App />
        </QueryProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}

// 启动应用
initializeApp().catch(error => {
  console.error('应用初始化失败:', error);
});
