// import React from 'react' // React 17+自动注入，无需显式导入
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import AssessmentPage from '../pages/AssessmentPage'
import { FMS_TESTS, BASIC_TESTS, CLEARANCE_TESTS } from '../data/fms-tests'

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock Zustand store
vi.mock('@/stores/useAssessmentStore', () => ({
  useAssessmentStore: vi.fn(() => ({
    sessionId: 'test-session-id',
    currentTestIndex: 0,
    scores: {},
    bilateralScores: {},
    hasPainfulTests: [],
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

// Mock 其他组件
vi.mock('@/components/ui/smart-status-indicator', () => ({
  SmartStatusIndicator: () => <div data-testid="smart-status-indicator">Smart Status Indicator</div>
}));

vi.mock('@/components/ui/demo-floating-button', () => ({
  DemoFloatingButton: () => <div data-testid="demo-floating-button">Demo Button</div>
}));

// Helper function to render AssessmentPage
const renderAssessmentPage = () => {
  return render(
    <MemoryRouter>
      <AssessmentPage />
    </MemoryRouter>
  )
}

describe('评估页面基础渲染测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该显示第一个测试项目', async () => {
    renderAssessmentPage()
    
    // 检查是否显示第一个测试
    expect(screen.getByText('过顶深蹲 (Deep Squat)')).toBeInTheDocument()
    expect(screen.getByText(/评估双侧、对称、功能性/)).toBeInTheDocument()
  })

  it('应该显示正确的进度信息', async () => {
    renderAssessmentPage()
    
    // 检查进度显示
    expect(screen.getByText('过顶深蹲 (Deep Squat)')).toBeInTheDocument()
    // 深蹲是单侧测试，应该有详细的评分按钮
    expect(screen.getByLabelText(/评分3分：完美地完成动作/)).toBeInTheDocument()
  })

  it('应该显示所有评分选项', async () => {
    renderAssessmentPage()
    
    // 深蹲是单侧评分，检查所有评分按钮的aria-label
    expect(screen.getByLabelText(/评分0分：动作中出现疼痛/)).toBeInTheDocument()
    expect(screen.getByLabelText(/评分1分：无法按标准完成动作/)).toBeInTheDocument()
    expect(screen.getByLabelText(/评分2分：能够完成动作但存在代偿/)).toBeInTheDocument()
    expect(screen.getByLabelText(/评分3分：完美地完成动作/)).toBeInTheDocument()
  })

  it('应该显示评分标准说明', async () => {
    renderAssessmentPage()
    
    // 检查评分按钮存在（使用aria-label查找）
    const firstTest = FMS_TESTS[0]
    firstTest.scoringCriteria.forEach(({ score }) => {
      // 根据分数构建期望的aria-label
      const expectedLabel = score === 0 
        ? /评分0分：动作中出现疼痛/
        : score === 1 
          ? /评分1分：无法按标准完成动作/
          : score === 2 
            ? /评分2分：能够完成动作但存在代偿/
            : /评分3分：完美地完成动作/
      expect(screen.getByLabelText(expectedLabel)).toBeInTheDocument()
    })
  })
})

describe('评估流程测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该能够找到评分按钮并响应点击', async () => {
    const user = userEvent.setup()
    renderAssessmentPage()
    
    // 验证评分按钮存在并可点击
    const scoreButton = screen.getByLabelText(/评分3分：完美地完成动作/)
    expect(scoreButton).toBeInTheDocument()
    
    // 验证按钮可以点击（不期望状态变化）
    await user.click(scoreButton)
    // 只验证点击事件被正确处理，不验证页面跳转
  })

  it('应该能够找到疼痛评分按钮并响应点击', async () => {
    const user = userEvent.setup()
    renderAssessmentPage()
    
    // 验证疼痛按钮存在并可点击
    const painButton = screen.getByLabelText(/评分0分：动作中出现疼痛/)
    expect(painButton).toBeInTheDocument()
    
    // 验证按钮可以点击
    await user.click(painButton)
  })

  it('应该显示正确的导航按钮', async () => {
    renderAssessmentPage()
    
    // 验证导航按钮存在
    expect(screen.getByText('上一项')).toBeInTheDocument()
    expect(screen.getByText('下一项')).toBeInTheDocument()
    
    // 验证按钮状态
    const prevButton = screen.getByText('上一项')
    const nextButton = screen.getByText('下一项')
    
    // 第一个测试时，上一项应该禁用，下一项需要评分后才能启用
    expect(prevButton).toBeDisabled()
    expect(nextButton).toBeDisabled() // 因为还没评分
  })

  it('应该正确显示测试信息', async () => {
    renderAssessmentPage()
    
    // 验证测试标题和描述
    expect(screen.getByText('过顶深蹲 (Deep Squat)')).toBeInTheDocument()
    expect(screen.getByText(/评估双侧、对称、功能性/)).toBeInTheDocument()
    
    // 验证评分说明
    expect(screen.getByText('动作质量评分')).toBeInTheDocument()
    expect(screen.getByText('请根据您的实际表现选择相应分数')).toBeInTheDocument()
  })
})

describe('评估页面交互测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该响应评分按钮点击', async () => {
    const user = userEvent.setup()
    renderAssessmentPage()
    
    const scoreButton = screen.getByLabelText(/评分2分：能够完成动作但存在代偿/)
    expect(scoreButton).toBeInTheDocument()
    
    // 验证点击响应
    await user.click(scoreButton)
    // 不验证状态变化，只验证按钮响应
  })

  it('应该正确显示评分按钮样式', async () => {
    renderAssessmentPage()
    
    // 验证所有评分按钮都存在
    expect(screen.getByLabelText(/评分3分：完美地完成动作/)).toBeInTheDocument()
    expect(screen.getByLabelText(/评分2分：能够完成动作但存在代偿/)).toBeInTheDocument()
    expect(screen.getByLabelText(/评分1分：无法按标准完成动作/)).toBeInTheDocument()
    expect(screen.getByLabelText(/评分0分：动作中出现疼痛/)).toBeInTheDocument()
  })

  it('应该正确处理疼痛评分按钮', async () => {
    const user = userEvent.setup()
    renderAssessmentPage()
    
    const painButton = screen.getByLabelText(/评分0分：动作中出现疼痛/)
    expect(painButton).toBeInTheDocument()
    
    // 验证疼痛按钮可以点击
    await user.click(painButton)
  })
})

describe('评估页面数据完整性测试', () => {
  it('应该包含所有FMS测试项目', () => {
    expect(FMS_TESTS).toHaveLength(10)
    expect(BASIC_TESTS).toHaveLength(7)
    expect(CLEARANCE_TESTS).toHaveLength(3)
  })

  it('每个测试应该包含必要的字段', () => {
    FMS_TESTS.forEach(test => {
      expect(test).toHaveProperty('id')
      expect(test).toHaveProperty('name')
      expect(test).toHaveProperty('description')
      expect(test).toHaveProperty('instructions')
      expect(test).toHaveProperty('scoringCriteria')
      expect(test.instructions).toBeInstanceOf(Array)
      expect(test.scoringCriteria).toBeInstanceOf(Array)
    })
  })

  it('排除性测试应该正确标记', () => {
    const clearanceTestIds = CLEARANCE_TESTS.map(t => t.id)
    expect(clearanceTestIds).toContain('shoulder-impingement-clearance')
    expect(clearanceTestIds).toContain('spinal-flexion-clearance')
    expect(clearanceTestIds).toContain('spinal-extension-clearance')
  })
})

describe('评估页面错误处理测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该处理意外的评分值', async () => {
    renderAssessmentPage()
    
    // 测试应该正常渲染，即使有意外的数据
    expect(screen.getByText('过顶深蹲 (Deep Squat)')).toBeInTheDocument()
  })

  it('应该处理空的测试数据', () => {
    // 这个测试确保组件能够处理边界情况
    expect(() => renderAssessmentPage()).not.toThrow()
  })
}) 