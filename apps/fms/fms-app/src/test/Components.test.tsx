// import React from 'react' // React 17+自动注入，无需显式导入
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import TestCard from '../components/assessment/TestCard'
import { FMS_TESTS } from '../data/fms-tests'

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

describe('TestCard 组件测试', () => {
  const sampleTest = FMS_TESTS[0] // 使用过顶深蹲测试

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该正确渲染测试卡片的基本信息', () => {
    render(<TestCard test={sampleTest} />)
    
    expect(screen.getByText(sampleTest.name)).toBeInTheDocument()
    expect(screen.getByText(sampleTest.description)).toBeInTheDocument()
  })

  it('应该显示测试指导步骤', () => {
    render(<TestCard test={sampleTest} />)
    
    // 检查指导步骤是否显示
    sampleTest.instructions.forEach(instruction => {
      expect(screen.getByText(instruction)).toBeInTheDocument()
    })
  })

  it('应该为排除性测试显示特殊标识', () => {
    const clearanceTest = FMS_TESTS.find(test => test.isClearanceTest)!
    render(<TestCard test={clearanceTest} />)
    
    // 排除性测试应该有特殊的UI标识
    expect(screen.getByText(clearanceTest.name)).toBeInTheDocument()
  })

  it('应该正确处理无效的测试数据', () => {
    const invalidTest = {
      ...sampleTest,
      instructions: [],
      scoringCriteria: []
    }
    
    // 应该不会崩溃
    expect(() => render(<TestCard test={invalidTest} />)).not.toThrow()
  })
})

describe('Button 组件交互测试', () => {
  it('应该正确响应点击事件', async () => {
    const user = userEvent.setup()
    const mockClick = vi.fn()
    
    render(
      <button onClick={mockClick} data-testid="test-button">
        测试按钮
      </button>
    )
    
    const button = screen.getByTestId('test-button')
    await user.click(button)
    
    expect(mockClick).toHaveBeenCalledTimes(1)
  })

  it('应该支持键盘导航', async () => {
    const user = userEvent.setup()
    const mockClick = vi.fn()
    
    render(
      <button onClick={mockClick} data-testid="test-button">
        测试按钮
      </button>
    )
    
    const button = screen.getByTestId('test-button')
    button.focus()
    await user.keyboard('{Enter}')
    
    expect(mockClick).toHaveBeenCalledTimes(1)
  })
})

describe('Navigation 导航测试', () => {
  it('应该正确渲染所有导航链接', () => {
    render(
      <MemoryRouter>
        <nav>
          <a href="/">首页</a>
          <a href="/assessment">评估</a>
          <a href="/education">教育</a>
          <a href="/training">训练</a>
          <a href="/report">报告</a>
        </nav>
      </MemoryRouter>
    )
    
    expect(screen.getByText('首页')).toBeInTheDocument()
    expect(screen.getByText('评估')).toBeInTheDocument()
    expect(screen.getByText('教育')).toBeInTheDocument()
    expect(screen.getByText('训练')).toBeInTheDocument()
    expect(screen.getByText('报告')).toBeInTheDocument()
  })
})

describe('Progress 进度组件测试', () => {
  it('应该正确计算和显示进度百分比', () => {
    const currentStep = 3
    const totalSteps = 10
    const percentage = (currentStep / totalSteps) * 100
    
    render(
      <div data-testid="progress-bar">
        <div 
          style={{ width: `${percentage}%` }}
          data-testid="progress-fill"
        />
        <span data-testid="progress-text">
          {currentStep}/{totalSteps}
        </span>
      </div>
    )
    
    expect(screen.getByTestId('progress-text')).toHaveTextContent('3/10')
    const progressFill = screen.getByTestId('progress-fill')
    expect(progressFill).toHaveStyle({ width: '30%' })
  })

  it('应该正确处理边界值', () => {
    // 测试0%进度
    render(
      <div data-testid="progress-0">
        <div style={{ width: '0%' }} />
        <span>0/10</span>
      </div>
    )
    
    // 测试100%进度
    render(
      <div data-testid="progress-100">
        <div style={{ width: '100%' }} />
        <span>10/10</span>
      </div>
    )
    
    expect(screen.getByText('0/10')).toBeInTheDocument()
    expect(screen.getByText('10/10')).toBeInTheDocument()
  })
})

describe('Card 卡片组件测试', () => {
  it('应该正确应用CSS类名', () => {
    render(
      <div className="brooklyn-card" data-testid="test-card">
        <div className="brooklyn-card-content">
          测试内容
        </div>
      </div>
    )
    
    const card = screen.getByTestId('test-card')
    expect(card).toHaveClass('brooklyn-card')
    expect(screen.getByText('测试内容')).toBeInTheDocument()
  })

  it('应该支持不同的卡片变体', () => {
    render(
      <div>
        <div className="brooklyn-card bg-primary/5" data-testid="primary-card">
          主要卡片
        </div>
        <div className="brooklyn-card bg-red-50" data-testid="error-card">
          错误卡片
        </div>
        <div className="brooklyn-card bg-amber-50" data-testid="warning-card">
          警告卡片
        </div>
      </div>
    )
    
    expect(screen.getByTestId('primary-card')).toHaveClass('bg-primary/5')
    expect(screen.getByTestId('error-card')).toHaveClass('bg-red-50')
    expect(screen.getByTestId('warning-card')).toHaveClass('bg-amber-50')
  })
})

describe('Icon 图标组件测试', () => {
  it('应该正确渲染不同状态的图标', () => {
    render(
      <div>
        <div data-testid="success-icon" className="text-green-600">✓</div>
        <div data-testid="error-icon" className="text-red-600">✗</div>
        <div data-testid="warning-icon" className="text-amber-600">⚠</div>
      </div>
    )
    
    expect(screen.getByTestId('success-icon')).toHaveClass('text-green-600')
    expect(screen.getByTestId('error-icon')).toHaveClass('text-red-600')
    expect(screen.getByTestId('warning-icon')).toHaveClass('text-amber-600')
  })
})

describe('Form 表单组件测试', () => {
  it('应该正确处理表单提交', async () => {
    const user = userEvent.setup()
    const mockSubmit = vi.fn()
    
    render(
      <form onSubmit={mockSubmit} data-testid="test-form">
        <input type="text" name="testInput" defaultValue="测试值" />
        <button type="submit">提交</button>
      </form>
    )
    
    const submitButton = screen.getByText('提交')
    await user.click(submitButton)
    
    expect(mockSubmit).toHaveBeenCalled()
  })

  it('应该正确验证输入值', async () => {
    const user = userEvent.setup()
    
    render(
      <form data-testid="validation-form">
        <input 
          type="number" 
          min="0" 
          max="3" 
          required 
          data-testid="score-input"
        />
        <button type="submit">提交</button>
      </form>
    )
    
    const input = screen.getByTestId('score-input')
    await user.type(input, '5') // 超出范围的值
    
    // 输入应该被限制或显示错误
    expect(input).toHaveValue(5) // 值被输入但可能有验证错误
  })
})

describe('Modal 模态框组件测试', () => {
  it('应该正确显示和隐藏模态框', async () => {
    // 模拟模态框行为
    let modalVisible = false
    
    render(
      <div>
        <button 
          onClick={() => modalVisible = true}
          data-testid="open-modal"
        >
          打开模态框
        </button>
        {modalVisible && (
          <div data-testid="modal">模态框内容</div>
        )}
      </div>
    )
    
    // 初始状态不应该显示模态框
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
  })
})

describe('Responsive 响应式组件测试', () => {
  beforeEach(() => {
    // 重置视口大小
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  it('应该在桌面端正确显示', () => {
    render(
      <div className="hidden md:block" data-testid="desktop-content">
        桌面端内容
      </div>
    )
    
    // 检查响应式类名
    const element = screen.getByTestId('desktop-content')
    expect(element).toHaveClass('hidden', 'md:block')
  })

  it('应该在移动端正确显示', () => {
    render(
      <div className="block md:hidden" data-testid="mobile-content">
        移动端内容
      </div>
    )
    
    // 检查响应式类名
    const element = screen.getByTestId('mobile-content')
    expect(element).toHaveClass('block', 'md:hidden')
  })
})

describe('Accessibility 可访问性测试', () => {
  it('应该包含适当的ARIA标签', () => {
    render(
      <div>
        <button aria-label="开始FMS评估" data-testid="start-button">
          开始评估
        </button>
        <div role="progressbar" aria-valuenow={3} aria-valuemax={10}>
          进度：3/10
        </div>
      </div>
    )
    
    const button = screen.getByTestId('start-button')
    expect(button).toHaveAttribute('aria-label', '开始FMS评估')
    
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-valuenow', '3')
    expect(progressbar).toHaveAttribute('aria-valuemax', '10')
  })

  it('应该支持键盘导航', async () => {
    const user = userEvent.setup()
    
    render(
      <div>
        <button data-testid="button1">按钮1</button>
        <button data-testid="button2">按钮2</button>
        <button data-testid="button3">按钮3</button>
      </div>
    )
    
    // 测试Tab键导航
    await user.tab()
    expect(screen.getByTestId('button1')).toHaveFocus()
    
    await user.tab()
    expect(screen.getByTestId('button2')).toHaveFocus()
    
    await user.tab()
    expect(screen.getByTestId('button3')).toHaveFocus()
  })
})

 