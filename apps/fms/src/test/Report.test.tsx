// import React from 'react' // React 17+自动注入，无需显式导入
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import { MemoryRouter } from 'react-router-dom'
// import userEvent from '@testing-library/user-event' // 已移除，不再需要
import ReportPage from '../pages/ReportPage'
import { BASIC_TESTS, CLEARANCE_TESTS } from '../data/fms-tests'
import { useAppStore } from '../stores/useAppStore'

// Mock Recharts
vi.mock('recharts', () => ({
  Radar: ({ children }: any) => <div data-testid="radar-chart">{children}</div>,
  RadarChart: ({ children }: any) => <div data-testid="radar-chart">{children}</div>,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  Legend: () => <div data-testid="legend" />,
}))

// Mock ClientOnly
vi.mock('../components/shared/ClientOnly', () => ({
  default: ({ children }: any) => children,
}))

// Mock react-router-dom exports to avoid warnings

// Helper function to render ReportPage with different states
const renderReportPage = (reportData: any = null) => {
  // 在渲染前设置store状态
  if (reportData) {
    useAppStore.getState().setReportData(reportData)
  } else {
    useAppStore.getState().setReportData(null)
  }
  
  return render(
    <MemoryRouter initialEntries={['/report']}>
      <ReportPage />
    </MemoryRouter>
  )
}

// 创建测试数据
const createTestScores = (basicScores: number[], clearanceScores: number[] = [1, 1, 1]) => {
  const scores: Record<string, number> = {}
  const basicTestIds = BASIC_TESTS.map(t => t.id)
  const clearanceTestIds = CLEARANCE_TESTS.map(t => t.id)
  
  basicTestIds.forEach((id, index) => {
    scores[id] = index < basicScores.length ? basicScores[index] : 3
  })
  
  clearanceTestIds.forEach((id, index) => {
    scores[id] = index < clearanceScores.length ? clearanceScores[index] : 1
  })
  
  return {
    scores,
    painfulTests: Object.entries(scores).filter(([, score]) => score === 0).map(([id]) => id),
    basicTests: basicTestIds,
    clearanceTests: clearanceTestIds,
  }
}

describe('报告页面渲染测试', () => {
  beforeEach(() => {
    // 清理store状态
    useAppStore.getState().setReportData(null)
  })

  it('应该显示无数据提示当没有评估结果时', () => {
    renderReportPage()
    
    expect(screen.getByText('暂无评估数据')).toBeInTheDocument()
    expect(screen.getByText(/请先完成FMS功能性动作筛查/)).toBeInTheDocument()
    expect(screen.getByText('开始 FMS 评估')).toBeInTheDocument()
  })

  it('应该正确显示优秀总分报告', () => {
    const testData = createTestScores([3, 3, 3, 3, 3, 3, 3]) // 21分满分
    renderReportPage(testData)
    
    expect(screen.getByText('FMS 评估报告')).toBeInTheDocument()
    expect(screen.getByText('总分：21/21分')).toBeInTheDocument()
    expect(screen.getByText('功能状态：功能良好')).toBeInTheDocument()
    expect(screen.getByText('功能性动作表现优秀')).toBeInTheDocument()
  })

  it('应该正确显示良好总分报告', () => {
    const testData = createTestScores([3, 2, 2, 3, 2, 2, 2]) // 16分
    renderReportPage(testData)
    
    expect(screen.getByText('总分：16/21分')).toBeInTheDocument()
    expect(screen.getByText('功能状态：功能良好')).toBeInTheDocument()
    expect(screen.getByText('功能性动作表现良好')).toBeInTheDocument()
  })

  it('应该正确显示需要改善总分报告', () => {
    const testData = createTestScores([2, 2, 2, 2, 2, 1, 1]) // 12分
    renderReportPage(testData)
    
    expect(screen.getByText('总分：12/21分')).toBeInTheDocument()
    expect(screen.getByText('功能状态：建议改善')).toBeInTheDocument()
    expect(screen.getByText('存在功能受限或不对称风险')).toBeInTheDocument()
  })

  it('应该正确显示低分总分报告', () => {
    const testData = createTestScores([1, 1, 1, 1, 1, 1, 1]) // 7分
    renderReportPage(testData)
    
    expect(screen.getByText('总分：7/21分')).toBeInTheDocument()
    expect(screen.getByText('功能状态：建议改善')).toBeInTheDocument()
    expect(screen.getByText('存在功能受限或不对称风险')).toBeInTheDocument()
  })
})

describe('疼痛和风险警告测试', () => {
  beforeEach(() => {
    useAppStore.getState().setReportData(null)
  })

  it('应该显示疼痛警告当存在0分时', () => {
    const testData = createTestScores([0, 3, 3, 3, 3, 3, 3]) // 有一个疼痛项
    renderReportPage(testData)
    
    expect(screen.getByText('疼痛预警')).toBeInTheDocument()
    expect(screen.getByText(/在以下测试中检测到疼痛反应/)).toBeInTheDocument()
    expect(screen.getByText(/立即咨询物理治疗师/)).toBeInTheDocument()
  })

  it('应该显示排除测试异常警告', () => {
    const testData = createTestScores([3, 3, 3, 3, 3, 3, 3], [0, 1, 1]) // 有一个排除测试失败
    renderReportPage(testData)
    
    expect(screen.getByText('排除测试异常')).toBeInTheDocument()
    expect(screen.getByText(/以下排除测试未能通过/)).toBeInTheDocument()
  })

  it('应该同时显示疼痛和排除测试警告', () => {
    const testData = createTestScores([0, 3, 3, 3, 3, 3, 3], [0, 1, 1])
    renderReportPage(testData)
    
    expect(screen.getByText('疼痛预警')).toBeInTheDocument()
    expect(screen.getByText('排除测试异常')).toBeInTheDocument()
    expect(screen.getByText('功能状态：需要关注')).toBeInTheDocument()
    expect(screen.getByText('检测到疼痛或功能异常')).toBeInTheDocument()
  })
})

describe('数据分析和统计测试', () => {
  beforeEach(() => {
    useAppStore.getState().setReportData(null)
  })

  it('应该正确计算和显示统计数据', () => {
    const testData = createTestScores([3, 2, 2, 3, 2, 2, 2], [1, 1, 0]) // 16分基础，2个排除测试通过
    renderReportPage(testData)
    
    expect(screen.getByText('总分：16/21分')).toBeInTheDocument() // 总分显示
    expect(screen.getByText('基础动作测试 (16/21分)')).toBeInTheDocument()
    expect(screen.getByText('排除测试 (2/3项通过)')).toBeInTheDocument()
  })

  it('应该显示雷达图组件', () => {
    const testData = createTestScores([3, 2, 2, 3, 2, 2, 2])
    renderReportPage(testData)
    
    expect(screen.getAllByTestId('radar-chart')).toHaveLength(3) // RadarChart和两个Radar组件
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })

  it('应该显示低分项目分析', () => {
    const testData = createTestScores([1, 1, 3, 3, 3, 3, 3]) // 前两项得分低
    renderReportPage(testData)
    
    // 应该有改善建议区域
    expect(screen.getByText('重点改善建议')).toBeInTheDocument()
  })
})

describe('报告页面交互测试', () => {
  beforeEach(() => {
    useAppStore.getState().setReportData(null)
  })

  it('应该能够重新进行评估', async () => {
    const testData = createTestScores([3, 3, 3, 3, 3, 3, 3])
    renderReportPage(testData)
    
    const retestButton = screen.getByText(/重新评估/)
    expect(retestButton).toBeInTheDocument()
    
    // 验证重新评估按钮是一个链接并指向正确的路径
    const retestLink = retestButton.closest('a')
    expect(retestLink).toBeInTheDocument()
    expect(retestLink?.getAttribute('href')).toBe('/assessment')
  })

  it('应该显示打印功能按钮', () => {
    const testData = createTestScores([3, 3, 3, 3, 3, 3, 3])
    renderReportPage(testData)
    
    expect(screen.getByText('打印报告')).toBeInTheDocument()
  })

  it('应该显示查看训练建议链接', () => {
    const testData = createTestScores([1, 1, 2, 2, 2, 2, 2]) // 确保有低分项目显示训练建议
    renderReportPage(testData)
    
    // 查找训练相关的文本或链接 - 使用getAllBy处理多个匹配
    const trainElement = screen.getAllByText(/训练/)[0] || screen.getAllByText(/建议/)[0] || screen.getAllByText(/改善/)[0]
    expect(trainElement).toBeInTheDocument()
  })
})

describe('报告数据完整性测试', () => {
  beforeEach(() => {
    useAppStore.getState().setReportData(null)
  })

  it('应该正确处理完整的测试数据', () => {
    const testData = createTestScores([3, 2, 1, 3, 2, 1, 0], [1, 0, 1])
    renderReportPage(testData)
    
    // 验证所有必要信息都显示
    expect(screen.getByText('FMS 评估报告')).toBeInTheDocument()
    expect(screen.getByText(/基础动作测试/)).toBeInTheDocument()
    expect(screen.getByText(/排除测试 \(/)).toBeInTheDocument()
  })

  it('应该处理缺失数据的情况', () => {
    renderReportPage()
    
    // 验证无数据状态
    expect(screen.getByText('暂无评估数据')).toBeInTheDocument()
    expect(screen.getByText('开始 FMS 评估')).toBeInTheDocument()
  })

  it('应该处理部分数据的情况', () => {
    const incompleteData = {
      scores: { 'deep-squat': 3 }, // 只有一个测试的分数
      painfulTests: [],
      basicTests: ['deep-squat'],
      clearanceTests: [],
    }
    renderReportPage(incompleteData)
    
    // 验证可以处理不完整的数据
    expect(screen.getByText('FMS 评估报告')).toBeInTheDocument()
  })
})

describe('Zustand状态管理测试', () => {
  beforeEach(() => {
    useAppStore.getState().setReportData(null)
  })

  it('应该正确从store获取报告数据', () => {
    const testData = createTestScores([3, 3, 3, 3, 3, 3, 3])
    
    // 设置store状态
    useAppStore.getState().setReportData(testData)
    
    // 验证store状态
    const storeData = useAppStore.getState().reportData
    expect(storeData).toEqual(testData)
    
    // 渲染页面
    render(
      <MemoryRouter>
        <ReportPage />
      </MemoryRouter>
    )
    
    expect(screen.getByText('FMS 评估报告')).toBeInTheDocument()
  })

  it('应该处理store中无数据的情况', () => {
    // 确保store为空
    useAppStore.getState().setReportData(null)
    
    render(
      <MemoryRouter>
        <ReportPage />
      </MemoryRouter>
    )
    
    expect(screen.getByText('暂无评估数据')).toBeInTheDocument()
  })
}) 
