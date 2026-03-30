/**
 * 移动端导航组件测试
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EnhancedMobileNavigation } from '../EnhancedMobileNavigation';
import { MobileBottomNavigation } from '../MobileBottomNavigation';

// Mock auth store to ensure足够多的标签用于触发“更多”
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({
    user: { id: '1', email: 'test@example.com', role: 'admin' },
  }),
}));

// Mock the auth adapter
vi.mock('@/adapters/auth-adapter', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com', role: 'admin' },
    isAuthenticated: true,
  }),
  usePermissions: () => ({
    isAdmin: () => true,
    isManager: () => true,
    isOperator: () => true,
    hasRole: () => true,
  }),
}));

// Mock useLocation
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({ pathname: '/dashboard' }),
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('MobileBottomNavigation', () => {
  it('renders basic navigation tabs', () => {
    renderWithRouter(<MobileBottomNavigation />);

    expect(screen.getByText('首页')).toBeInTheDocument();
    expect(screen.getByText('出/入库')).toBeInTheDocument();
    expect(screen.getByText('库存')).toBeInTheDocument();
  });

  it('shows more menu when there are overflow tabs', () => {
    renderWithRouter(<MobileBottomNavigation />);

    // Should show "更多" button when存在溢出标签
    const moreButton = screen.queryByText('更多');
    expect(moreButton).toBeInTheDocument();
  });
});

describe('EnhancedMobileNavigation', () => {
  beforeEach(() => {
    // Reset any mocks before each test
    vi.clearAllMocks();
  });

  it('renders with priority strategy', () => {
    renderWithRouter(<EnhancedMobileNavigation strategy='priority' />);

    expect(screen.getByText('首页')).toBeInTheDocument();
    expect(screen.getByText('出/入库')).toBeInTheDocument();
    expect(screen.getByText('库存')).toBeInTheDocument();
  });

  it('shows more menu and handles click', () => {
    renderWithRouter(<EnhancedMobileNavigation strategy='priority' />);

    const moreButton = screen.getByText('更多');
    expect(moreButton).toBeInTheDocument();

    // Click more button to open menu
    fireEvent.click(moreButton);

    // Should show additional tabs in more menu
    expect(screen.getByText('更多功能')).toBeInTheDocument();
  });

  it('handles different navigation strategies', () => {
    const { rerender } = renderWithRouter(
      <EnhancedMobileNavigation strategy='priority' />
    );

    expect(screen.getByText('首页')).toBeInTheDocument();

    // Test category strategy
    rerender(
      <BrowserRouter>
        <EnhancedMobileNavigation strategy='category' />
      </BrowserRouter>
    );

    expect(screen.getByText('首页')).toBeInTheDocument();

    // Test role-based strategy
    rerender(
      <BrowserRouter>
        <EnhancedMobileNavigation strategy='role-based' />
      </BrowserRouter>
    );

    expect(screen.getByText('首页')).toBeInTheDocument();
  });

  it('closes more menu when clicking background', () => {
    renderWithRouter(<EnhancedMobileNavigation strategy='priority' />);

    const moreButton = screen.getByText('更多');
    fireEvent.click(moreButton);

    // Menu should be open
    expect(screen.getByText('更多功能')).toBeInTheDocument();

    // Click background to close
    const background = screen.getByRole('button', { name: /关闭更多菜单/i });
    fireEvent.click(background);

    // Menu should be closed (更多功能 should not be visible)
    expect(screen.queryByText('更多功能')).not.toBeInTheDocument();
  });
});

describe('Navigation Accessibility', () => {
  it('has proper ARIA labels', () => {
    renderWithRouter(<EnhancedMobileNavigation strategy='priority' />);

    const moreButton = screen.getByLabelText(/更多选项/);
    expect(moreButton).toBeInTheDocument();
  });

  it('supports keyboard navigation', () => {
    renderWithRouter(<EnhancedMobileNavigation strategy='priority' />);

    const moreButton = screen.getByText('更多');

    // Should be focusable
    moreButton.focus();
    expect(document.activeElement).toBe(moreButton);
  });
});

describe('Responsive Behavior', () => {
  it('adapts to different screen sizes', () => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    renderWithRouter(<EnhancedMobileNavigation strategy='priority' />);

    // Should render navigation for small screen
    expect(screen.getByText('首页')).toBeInTheDocument();

    // Change to larger screen
    Object.defineProperty(window, 'innerWidth', {
      value: 414,
    });

    // Trigger resize event
    fireEvent(window, new Event('resize'));

    // Should still render navigation
    expect(screen.getByText('首页')).toBeInTheDocument();
  });
});
