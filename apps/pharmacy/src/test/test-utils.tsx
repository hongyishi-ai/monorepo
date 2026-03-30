import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';

// 创建测试用的 QueryClient
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

// 测试包装器组件
interface AllTheProvidersProps {
  children: ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

// 自定义渲染函数
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// 重新导出所有 testing-library 的内容
export * from '@testing-library/react';
export { customRender as render };

// 测试数据工厂函数
export const createMockMedicine = (overrides = {}) => ({
  id: '1',
  barcode: '1234567890123',
  name: '阿司匹林',
  specification: '100mg',
  manufacturer: '拜耳制药',
  shelf_location: 'A-01-1',
  safety_stock: 10,
  unit: '盒',
  category: 'internal' as const,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockBatch = (overrides = {}) => ({
  id: '1',
  medicine_id: '1',
  batch_number: 'B001',
  production_date: '2024-01-01',
  expiry_date: '2025-01-01',
  quantity: 100,
  purchase_price: 10.5,
  selling_price: 15.0,
  supplier: '供应商A',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  full_name: '测试用户',
  role: 'operator' as const,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockInventoryTransaction = (overrides = {}) => ({
  id: '1',
  medicine_id: '1',
  batch_id: '1',
  transaction_type: 'inbound' as const,
  quantity: 50,
  unit_price: 10.5,
  total_amount: 525,
  operator_id: '1',
  notes: '入库测试',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});
