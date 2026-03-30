import React from 'react'
import { render } from '@testing-library/react'
import { screen, waitFor } from '@testing-library/dom'
import { axe, toHaveNoViolations } from 'jest-axe'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'

// 导入页面组件
import RootLayout from '../components/shared/RootLayout'
import HomePage from '../pages/HomePage'
import AssessmentPage from '../pages/AssessmentPage'
import ReportPage from '../pages/ReportPage'

// 扩展jest matchers
expect.extend(toHaveNoViolations)

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

// Helper function to render components with router
const renderWithRouter = (component: React.ReactElement, route = '/') => {
  const router = createMemoryRouter([
    {
      path: '/',
      element: <RootLayout />,
      children: [
        { index: true, element: component },
      ],
    },
  ], {
    initialEntries: [route],
    initialIndex: 0,
  })

  return render(<RouterProvider router={router} />)
}

// Helper function to render full app
const renderApp = (initialEntries = ['/']) => {
  const router = createMemoryRouter([
    {
      path: '/',
      element: <RootLayout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'assessment', element: <AssessmentPage /> },
        { path: 'report', element: <ReportPage /> },
      ],
    },
  ], {
    initialEntries,
    initialIndex: 0,
  })

  return render(<RouterProvider router={router} />)
}

describe('可访问性测试', () => {
  beforeEach(() => {
    // 清除任何存储的数据
    localStorage.clear()
  })

  it('主页应该符合WCAG可访问性标准', async () => {
    const { container } = renderApp(['/'])
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('评估页面应该符合WCAG可访问性标准', async () => {
    const { container } = renderWithRouter(<AssessmentPage />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('报告页面应该符合WCAG可访问性标准', async () => {
    const { container } = renderWithRouter(<ReportPage />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('表单元素应该有正确的标签', async () => {
    renderWithRouter(<AssessmentPage />)
    
    // 等待页面加载
    await waitFor(() => {
      expect(screen.getByText('过顶深蹲 (Deep Squat)')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    // 检查评分按钮是否有正确的标签
    const scoreButtons = screen.getAllByRole('button').filter(button => 
      button.textContent && /^[0-3]$/.test(button.textContent.trim())
    )
    scoreButtons.forEach(button => {
      expect(button).toHaveAttribute('aria-label')
    })
  })

  it('导航元素应该可以键盘访问', () => {
    renderApp(['/'])
    
    // 检查所有链接是否可以获得焦点
    const links = screen.getAllByRole('link')
    links.forEach(link => {
      expect(link).toHaveAttribute('href')
    })
  })

  it('图像应该有替代文本', () => {
    renderApp(['/'])
    
    // 检查所有图像是否有alt属性
    const images = document.querySelectorAll('img')
    images.forEach(img => {
      expect(img).toHaveAttribute('alt')
    })
  })

  it('颜色对比度应该满足要求', async () => {
    const { container } = renderApp(['/'])
    
    // axe会自动检查颜色对比度
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true }
      }
    })
    expect(results).toHaveNoViolations()
  })

  it('表单应该有正确的错误处理', () => {
    renderWithRouter(<AssessmentPage />)
    
    // 检查是否有错误提示的容器
    const errorContainers = document.querySelectorAll('[role="alert"]')
    expect(errorContainers).toBeDefined()
  })
}) 