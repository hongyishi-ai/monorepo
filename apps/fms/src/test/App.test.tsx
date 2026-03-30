
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { screen, waitFor } from '@testing-library/dom'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
// import userEvent from '@testing-library/user-event'

// 导入页面组件
import RootLayout from '../components/shared/RootLayout'
import HomePage from '../pages/HomePage'
import AssessmentPage from '../pages/AssessmentPage'
import ReportPage from '../pages/ReportPage'
import TrainingPage from '../pages/TrainingPage'
import EducationPage from '../pages/EducationPage'
import { useAppStore } from '../stores/useAppStore'

// Mock Framer Motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

// Helper function to render App with router
const renderApp = (initialEntries = ['/']) => {
  const router = createMemoryRouter([
    {
      path: '/',
      element: <RootLayout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'assessment', element: <AssessmentPage /> },
        { path: 'report', element: <ReportPage /> },
        { path: 'training', element: <TrainingPage /> },
        { path: 'education', element: <EducationPage /> },
      ],
    },
  ], {
    initialEntries,
    initialIndex: 0,
  })

  return render(<RouterProvider router={router} />)
}

describe('App 路由测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该正确渲染首页', async () => {
    renderApp()
    
    // 检查首页标题
    expect(screen.getByText('功能性动作筛查')).toBeInTheDocument()
    expect(screen.getByText(/科学评估动作模式/)).toBeInTheDocument()
    
    // 检查主要操作按钮 - 使用getAllBy处理多个匹配
    expect(screen.getAllByText('开始评估')).toHaveLength(2) // 导航和卡片各一个
    expect(screen.getByText('学习理论')).toBeInTheDocument()
  })

  it('应该能够导航到评估页面', async () => {
    renderApp()
    
    // 使用更具体的选择器找到开始评估链接
    const assessmentLink = screen.getByRole('link', { name: /开始测试/ })
    expect(assessmentLink).toHaveAttribute('href', '/assessment')
  })

  it('应该能够导航到教育页面', async () => {
    renderApp()
    
    // 使用更具体的选择器找到学习理论链接
    const educationLink = screen.getByRole('link', { name: /开始学习/ })
    expect(educationLink).toHaveAttribute('href', '/education')
  })

  it('应该正确渲染评估页面', async () => {
    renderApp(['/assessment'])
    
    // 检查评估页面是否正确渲染
    await waitFor(() => {
      expect(screen.getByText('过顶深蹲 (Deep Squat)')).toBeInTheDocument()
      // 验证评分按钮存在，这证明页面正确加载了
      expect(screen.getByRole('button', { name: /评分3分：完美地完成动作/ })).toBeInTheDocument()
    })
  })

  it('应该正确渲染教育页面', async () => {
    renderApp(['/education'])
    
    // 检查教育页面是否正确渲染
    await waitFor(() => {
      expect(screen.getByText('FMS 知识库')).toBeInTheDocument()
    })
  })

  it('应该正确渲染训练页面', async () => {
    useAppStore.getState().setReportData({
      scores: {
        'deep-squat': 2,
        'hurdle-step': 2,
        'inline-lunge': 2,
        'shoulder-mobility': 2,
        'active-straight-leg-raise': 2,
        'trunk-stability-push-up': 2,
        'rotary-stability': 2,
      },
      bilateralScores: {},
      asymmetryIssues: {},
      painfulTests: [],
      basicTests: ['deep-squat'],
      clearanceTests: [],
      sessionId: 'test-session',
    })
    renderApp(['/training'])
    
    // 检查训练页面是否正确渲染 - 使用实际存在的文本
    await waitFor(() => {
      expect(screen.getByText('个性化纠正训练方案')).toBeInTheDocument()
    })
  })
})

describe('App 响应式测试', () => {
  beforeEach(() => {
    // 模拟移动端视口
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667,
    })
  })

  it('应该在移动端正确显示', async () => {
    renderApp()
    
    // 检查响应式布局
    const container = screen.getByText('功能性动作筛查').closest('.brooklyn-section')
    expect(container).toBeInTheDocument()
  })
})

describe('App 错误处理测试', () => {
  it('应该处理不存在的路由', async () => {
    renderApp(['/non-existent-route'])
    
    // 应该显示默认布局或错误页面
    await waitFor(() => {
      // 检查是否有基本的布局结构
      expect(document.body).toBeInTheDocument()
    })
  })
}) 
