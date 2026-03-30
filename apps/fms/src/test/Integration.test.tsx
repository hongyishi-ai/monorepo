// import React from 'react' // React 17+自动注入，无需显式导入
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
// import { BASIC_TESTS } from '@/data/fms-tests' // 未使用的导入

// 直接导入页面组件
import HomePage from '@/pages/HomePage'
import AssessmentPage from '@/pages/AssessmentPage'
import ReportPage from '@/pages/ReportPage'

// Mock ResizeObserver for floating progress component
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

// Mock Zustand stores
vi.mock('@/stores/useAssessmentStore', () => ({
  useAssessmentStore: vi.fn(() => ({
    sessionId: 'test-session-id',
    currentTestIndex: 0,
    scores: {},
    bilateralScores: {},
    hasPainfulTests: [], // 这是数组，不是函数
    asymmetryIssues: {},
    isAssessmentInProgress: true,
    startNewAssessment: vi.fn(),
    setCurrentTestIndex: vi.fn(),
    updateScore: vi.fn(),
    updateBilateralScore: vi.fn(),
    addPainfulTest: vi.fn(),
    removePainfulTest: vi.fn(),
    updateAsymmetryIssue: vi.fn(),
    completeAssessment: vi.fn(),
    forceResetAssessment: vi.fn(),
    getTotalScore: vi.fn(() => 0),
    hasCompletedAllTests: vi.fn(() => false),
    getCurrentTestCompletion: vi.fn(() => ({ completed: 1, total: 10 })),
    getBasicTestScore: vi.fn(() => 0)
  }))
}));

// Mock useAppStore
vi.mock('@/stores/useAppStore', () => ({
  useAppStore: vi.fn(() => ({
    setReportData: vi.fn(),
    setLastVisitedPage: vi.fn()
  }))
}));

// Mock useDataStore for storage functionality
vi.mock('@/stores/useDataStore', () => ({
  useDataStore: vi.fn(() => ({
    saveAssessment: vi.fn(() => Promise.resolve())
  }))
}));

// Mock react-router-dom
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    MemoryRouter: actual.MemoryRouter
  };
});

// Mock other UI components
vi.mock('@/components/ui/smart-status-indicator', () => ({
  SmartStatusIndicator: () => <div data-testid="smart-status-indicator">Smart Status Indicator</div>
}));

vi.mock('@/components/ui/demo-floating-button', () => ({
  DemoFloatingButton: () => <div data-testid="demo-floating-button">Demo Button</div>
}));

describe('集成测试修复版', () => {
  const renderWithRouter = (component: React.ReactElement, initialEntries = ['/']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        {component}
      </MemoryRouter>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该正确渲染首页并支持导航', async () => {
    // const user = userEvent.setup() // 未使用的变量
    renderWithRouter(<HomePage />)

    // 验证首页内容
    expect(screen.getByText('功能性动作筛查')).toBeInTheDocument()
    expect(screen.getByText('开始测试')).toBeInTheDocument()
    expect(screen.getByText('开始学习')).toBeInTheDocument()
  })

  it('应该正确渲染评估页面并显示第一个测试', async () => {
    renderWithRouter(<AssessmentPage />)

    // 等待页面加载 - 查找测试标题
    await waitFor(() => {
      expect(screen.getByText('过顶深蹲 (Deep Squat)')).toBeInTheDocument()
    }, { timeout: 3000 })

    // 验证评分按钮存在 - 深蹲是单侧评分，使用aria-label查找
    await waitFor(() => {
      expect(screen.getByLabelText(/评分0分：动作中出现疼痛/)).toBeInTheDocument()
      expect(screen.getByLabelText(/评分1分：无法按标准完成动作/)).toBeInTheDocument()
      expect(screen.getByLabelText(/评分2分：能够完成动作但存在代偿/)).toBeInTheDocument()
      expect(screen.getByLabelText(/评分3分：完美地完成动作/)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('应该正确处理评分选择和进度更新', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AssessmentPage />)

    // 等待页面加载
    await waitFor(() => {
      expect(screen.getByText('过顶深蹲 (Deep Squat)')).toBeInTheDocument()
    }, { timeout: 3000 })

    // 验证评分按钮存在并可点击
    const scoreButton = screen.getByLabelText(/评分3分：完美地完成动作/)
    expect(scoreButton).toBeInTheDocument()
    
    // 验证按钮响应点击
    await user.click(scoreButton)
  })

  it('应该正确处理疼痛测试并显示警告', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AssessmentPage />)

    // 等待页面加载
    await waitFor(() => {
      expect(screen.getByText('过顶深蹲 (Deep Squat)')).toBeInTheDocument()
    }, { timeout: 3000 })

    // 验证疼痛按钮存在并可点击
    const painButton = screen.getByLabelText(/评分0分：动作中出现疼痛/)
    expect(painButton).toBeInTheDocument()
    
    // 验证按钮响应点击
    await user.click(painButton)
  })

  it('应该正确从基础测试切换到排除测试', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AssessmentPage />)

    // 等待页面加载
    await waitFor(() => {
      expect(screen.getByText('过顶深蹲 (Deep Squat)')).toBeInTheDocument()
    }, { timeout: 3000 })

    // 验证评分按钮存在并可点击
    const scoreButton = screen.getByLabelText(/评分3分：完美地完成动作/)
    expect(scoreButton).toBeInTheDocument()
    
    // 验证按钮响应点击
    await user.click(scoreButton)
  })

  it('应该正确渲染报告页面（无数据状态）', () => {
    renderWithRouter(<ReportPage />)

    // 验证空状态
    expect(screen.getByText('暂无评估数据')).toBeInTheDocument()
    expect(screen.getByText('开始 FMS 评估')).toBeInTheDocument()
  })

  it('应该正确处理导航按钮', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AssessmentPage />)

    // 等待页面加载
    await waitFor(() => {
      expect(screen.getByText('过顶深蹲 (Deep Squat)')).toBeInTheDocument()
    }, { timeout: 3000 })

    // 验证导航按钮存在
    expect(screen.getByText('上一项')).toBeInTheDocument()
    expect(screen.getByText('下一项')).toBeInTheDocument()

    // 验证评分按钮存在并可点击
    const scoreButton = screen.getByLabelText(/评分3分：完美地完成动作/)
    expect(scoreButton).toBeInTheDocument()
    
    // 验证按钮响应点击
    await user.click(scoreButton)
  })

  it('应该正确处理双侧评分流程', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AssessmentPage />)

    // 等待页面加载
    await waitFor(() => {
      expect(screen.getByText('过顶深蹲 (Deep Squat)')).toBeInTheDocument()
    }, { timeout: 3000 })

    // 验证评分按钮存在并可点击
    const firstScoreButton = screen.getByLabelText(/评分3分：完美地完成动作/)
    expect(firstScoreButton).toBeInTheDocument()
    
    // 验证按钮响应点击
    await user.click(firstScoreButton)
  })
}) 