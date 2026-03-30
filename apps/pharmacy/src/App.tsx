import { Suspense, lazy, useEffect } from 'react';
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from 'react-router-dom';

import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ErrorBoundary } from './components/error/ErrorBoundary';
import { AppLayout } from './components/layout/AppLayout';
import {
  LazyAuditLogsPage,
  LazyDashboardPage,
  LazyInventoryPage,
  LazyMedicineManagementPage,
  LazyReportsPage,
  LazyUserManagementPage,
  initializePreloading,
} from './components/lazy-pages';
import { NetworkStatus } from './components/pwa/NetworkStatus';
import { PWAInstaller } from './components/pwa/PWAInstaller';
import { LoadingSpinner } from './components/ui/loading-spinner';
import { Toaster } from './components/ui/toaster';
import { initializeAuthSystem } from './lib/auth-init';
import {
  registerServiceWorker,
  unregisterServiceWorkersForDev,
} from './lib/pwa';
import { LoginPage } from './pages/LoginPage';

import { useAuthStore } from '@/stores/auth.store';

// 新的统一出/入库页面
const LazyInventoryOperationPage = lazy(() =>
  import('./pages/InventoryOperationPage').then(module => ({
    default: module.InventoryOperationPage,
  }))
);

// 使用优化的懒加载页面组件

function App() {
  // 使用旧认证系统获取认证状态
  const { isInitializing } = useAuthStore();

  useEffect(() => {
    // 初始化认证系统（包含认证状态和监听器）
    const initAuth = async () => {
      try {
        console.log('🚀 开始初始化认证系统...');
        await initializeAuthSystem();
        console.log('✅ 认证系统初始化成功');
      } catch (error) {
        console.error('❌ 认证系统初始化失败:', error);

        // 显示用户友好的错误信息
        if (error instanceof Error) {
          if (
            error.message.includes('ERR_CONNECTION_RESET') ||
            error.message.includes('Failed to fetch')
          ) {
            console.warn('⚠️ 网络连接问题，应用将在连接恢复后自动重试');
          }
        }
      }
    };

    // 注册/注销 Service Worker（仅生产注册，开发注销）
    const registerSW = async () => {
      try {
        if (import.meta.env.DEV) {
          await unregisterServiceWorkersForDev();
        } else {
          await registerServiceWorker();
          console.log('✅ Service Worker 注册成功');
        }
      } catch (error) {
        console.error('❌ Service Worker 处理失败:', error);
      }
    };

    // 并行执行初始化任务，但不让错误阻止应用启动
    Promise.allSettled([initAuth(), registerSW()]).then(results => {
      const authResult = results[0];
      const swResult = results[1];

      if (authResult.status === 'rejected') {
        console.warn('认证初始化失败，但应用将继续运行');
      }

      if (swResult.status === 'rejected') {
        console.warn('Service Worker 注册失败，但应用将继续运行');
      }

      console.log('🎉 应用初始化完成');
    });

    // 初始化预加载策略
    try {
      const state = useAuthStore.getState();
      const role = state.user?.role;
      initializePreloading(role);
    } catch {
      initializePreloading();
    }
  }, []);

  // 显示加载状态
  if (isInitializing) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* 登录路由 */}
            <Route path='/login' element={<LoginPage />} />

            {/* 开发环境测试路由已移除 - 认证系统已迁移到旧系统 */}

            {/* 受保护的路由 - 统一使用AppLayout */}
            <Route
              path='/dashboard'
              element={
                <ProtectedRoute>
                  <AppLayout title='仪表板'>
                    <LazyDashboardPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/users'
              element={
                <ProtectedRoute requiredRole='admin'>
                  <AppLayout title='用户管理'>
                    <LazyUserManagementPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/audit-logs'
              element={
                <ProtectedRoute requiredRole='admin'>
                  <AppLayout title='审计日志'>
                    <LazyAuditLogsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/medicines'
              element={
                <ProtectedRoute requiredRole='manager'>
                  <AppLayout title='药品管理'>
                    <LazyMedicineManagementPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/inventory'
              element={
                <ProtectedRoute>
                  <AppLayout title='库存查询'>
                    <LazyInventoryPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path='/inventory-operation'
              element={
                <ProtectedRoute>
                  <AppLayout title='出/入库操作'>
                    <LazyInventoryOperationPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* 保持向后兼容性的重定向 */}
            <Route
              path='/inbound'
              element={<Navigate to='/inventory-operation' replace />}
            />
            <Route
              path='/outbound'
              element={<Navigate to='/inventory-operation' replace />}
            />

            <Route
              path='/reports'
              element={
                <ProtectedRoute requiredRole='manager'>
                  <AppLayout title='报表中心'>
                    <LazyReportsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* 默认重定向 */}
            <Route path='/' element={<Navigate to='/dashboard' replace />} />

            {/* 404 页面 */}
            <Route path='*' element={<Navigate to='/dashboard' replace />} />
          </Routes>
        </Suspense>

        {/* 全局组件 */}
        <Toaster />
        <NetworkStatus />
        <PWAInstaller />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
