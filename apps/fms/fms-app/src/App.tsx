import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// 导入我们的页面组件
import RootLayout from './components/shared/RootLayout';
import FirstVisitDetector from './components/shared/FirstVisitDetector';
import OpeningPage from './pages/OpeningPage';
import HomePage from './pages/HomePage';
import AssessmentPage from './pages/AssessmentPage';
import ReportPage from './pages/ReportPage';
import TrainingPage from './pages/TrainingPage';
import EducationPage from './pages/EducationPage';
import AboutPage from './pages/AboutPage';
import HistoryPage from './pages/HistoryPage';

// 创建路由配置
const router = createBrowserRouter([
  // 开场页面 - 独立路由，不使用RootLayout
  { 
    path: '/opening', 
    element: <OpeningPage /> 
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
      { index: true, element: <HomePage /> },
      { path: 'assessment', element: <AssessmentPage /> },
      { path: 'report', element: <ReportPage /> },
      { path: 'training', element: <TrainingPage /> },
      { path: 'education', element: <EducationPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'about', element: <AboutPage /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
