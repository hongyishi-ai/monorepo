import { lazy, Suspense, type ComponentType } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// 导入我们的页面组件
import RootLayout from './components/shared/RootLayout';
import FirstVisitDetector from './components/shared/FirstVisitDetector';

const OpeningPage = lazy(() => import('./pages/OpeningPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const AssessmentPage = lazy(() => import('./pages/AssessmentPage'));
const ReportPage = lazy(() => import('./pages/ReportPage'));
const TrainingPage = lazy(() => import('./pages/TrainingPage'));
const EducationPage = lazy(() => import('./pages/EducationPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));

const routerBaseName =
  import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '');

export function RouteLoading() {
  return (
    <div
      role="status"
      aria-label="正在载入训练伤防治模块"
      className="brooklyn-section flex min-h-[50vh] items-center justify-center px-6"
    >
      <div className="w-full max-w-sm border-2 border-black bg-paper p-6 text-center shadow-[6px_6px_0_0_#A51F18]">
        <p className="mb-2 font-mono text-xs font-bold uppercase tracking-wide text-muted-foreground">
          HONG YISHI FMS
        </p>
        <p className="text-2xl font-black text-foreground">模块载入中</p>
      </div>
    </div>
  );
}

function withRouteLoading(Page: ComponentType) {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Page />
    </Suspense>
  );
}

// 创建路由配置
const router = createBrowserRouter([
  // 开场页面 - 独立路由，不使用RootLayout
  { 
    path: '/opening', 
    element: withRouteLoading(OpeningPage)
  },
  {
    path: '/',
    element: (
      <FirstVisitDetector>
        <RootLayout />
      </FirstVisitDetector>
    ),
    // errorElement: <ErrorPage />, // 未来可以添加一个错误页面
    children: [
      { index: true, element: withRouteLoading(HomePage) },
      { path: 'assessment', element: withRouteLoading(AssessmentPage) },
      { path: 'report', element: withRouteLoading(ReportPage) },
      { path: 'training', element: withRouteLoading(TrainingPage) },
      { path: 'education', element: withRouteLoading(EducationPage) },
      { path: 'history', element: withRouteLoading(HistoryPage) },
      { path: 'about', element: withRouteLoading(AboutPage) },
    ],
  },
], {
  basename: routerBaseName,
});

function App() {
  return <RouterProvider router={router} />;
}

export default App;
