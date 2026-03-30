# 技术架构指南

## 项目结构规范

### 目录结构
```
src/
├── components/          # 可复用组件
│   ├── ui/             # Shadcn/ui 基础组件
│   ├── layout/         # 布局组件 (Header, Sidebar, Footer)
│   ├── scanner/        # 扫码相关组件
│   ├── inventory/      # 库存管理组件
│   ├── reports/        # 报表组件
│   └── auth/           # 认证组件
├── pages/              # 页面组件
├── hooks/              # 自定义 hooks
├── stores/             # Zustand 状态管理
├── services/           # API 服务层
├── types/              # TypeScript 类型定义
├── utils/              # 工具函数
└── lib/                # 第三方库配置
```

### 组件命名规范
- 页面组件：`LoginPage.tsx`, `DashboardPage.tsx`
- 业务组件：`MedicineForm.tsx`, `BatchList.tsx`
- UI组件：`Button.tsx`, `Modal.tsx`
- 布局组件：`AppLayout.tsx`, `PageHeader.tsx`

## 状态管理架构

### Zustand Store 设计
```typescript
// 认证状态
interface AuthStore {
  // 状态
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // 操作
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

// 扫码状态
interface ScanStore {
  // 状态
  currentScan: ScannedItem | null;
  isScanning: boolean;
  scanHistory: ScannedItem[];
  
  // 操作
  setScanResult: (item: ScannedItem) => void;
  clearScan: () => void;
  setScanning: (isScanning: boolean) => void;
  addToHistory: (item: ScannedItem) => void;
}

// 通知状态
interface NotificationStore {
  // 状态
  notifications: Notification[];
  
  // 操作
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}
```

### React Query 配置
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟
      gcTime: 10 * 60 * 1000,   // 10分钟
      retry: (failureCount, error) => {
        if (error.status === 404) return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        useNotificationStore.getState().addNotification({
          type: 'error',
          message: error.message,
        });
      },
    },
  },
});
```

## API 服务层设计

### Supabase 客户端配置
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
```

### 服务层抽象
```typescript
// services/medicine.service.ts
export class MedicineService {
  static async getMedicines(params?: GetMedicinesParams): Promise<Medicine[]> {
    const query = supabase
      .from('medicines')
      .select('*, batches(*)')
      .order('name');
    
    if (params?.search) {
      query.ilike('name', `%${params.search}%`);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
  
  static async createMedicine(medicine: CreateMedicineInput): Promise<Medicine> {
    const { data, error } = await supabase
      .from('medicines')
      .insert(medicine)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}
```

## 数据库设计规范

### 表命名规范
- 使用复数形式：`medicines`, `batches`, `users`
- 使用下划线分隔：`inventory_transactions`
- 关联表使用描述性名称：`user_roles`

### 字段命名规范
- 主键：`id` (UUID)
- 外键：`{table_name}_id` (如 `medicine_id`)
- 时间戳：`created_at`, `updated_at`
- 布尔值：`is_active`, `has_expired`

### RLS 策略模板
```sql
-- 用户只能访问自己的数据
CREATE POLICY "Users can view own data" ON medicines
  FOR SELECT USING (auth.uid() = user_id);

-- 管理员可以访问所有数据
CREATE POLICY "Admins can view all data" ON medicines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

## 类型定义规范

### 数据库类型
```typescript
// types/database.ts
export interface Database {
  public: {
    Tables: {
      medicines: {
        Row: Medicine;
        Insert: CreateMedicineInput;
        Update: UpdateMedicineInput;
      };
      batches: {
        Row: Batch;
        Insert: CreateBatchInput;
        Update: UpdateBatchInput;
      };
    };
  };
}
```

### 业务类型
```typescript
// types/medicine.ts
export interface Medicine {
  id: string;
  barcode: string;
  name: string;
  specification: string;
  manufacturer: string;
  shelf_location?: string;
  safety_stock: number;
  created_at: string;
  updated_at: string;
}

export interface CreateMedicineInput {
  barcode: string;
  name: string;
  specification: string;
  manufacturer: string;
  shelf_location?: string;
  safety_stock?: number;
}
```

## 错误处理架构

### 错误类型定义
```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}
```

### 全局错误处理
```typescript
// components/ErrorBoundary.tsx
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // 发送错误到监控服务
  }
}
```

## 性能优化策略

### 代码分割
```typescript
// 路由级别懒加载
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const InventoryPage = lazy(() => import('@/pages/InventoryPage'));

// 组件级别懒加载
const HeavyComponent = lazy(() => import('@/components/HeavyComponent'));
```

### React Query 优化
```typescript
// 预取数据
const usePrefetchMedicines = () => {
  const queryClient = useQueryClient();
  
  return useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['medicines'],
      queryFn: MedicineService.getMedicines,
      staleTime: 10 * 60 * 1000,
    });
  }, [queryClient]);
};

// 乐观更新
const useUpdateMedicine = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: MedicineService.updateMedicine,
    onMutate: async (updatedMedicine) => {
      await queryClient.cancelQueries({ queryKey: ['medicines'] });
      const previousMedicines = queryClient.getQueryData(['medicines']);
      
      queryClient.setQueryData(['medicines'], (old: Medicine[]) =>
        old.map(medicine =>
          medicine.id === updatedMedicine.id
            ? { ...medicine, ...updatedMedicine }
            : medicine
        )
      );
      
      return { previousMedicines };
    },
    onError: (err, updatedMedicine, context) => {
      queryClient.setQueryData(['medicines'], context?.previousMedicines);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines'] });
    },
  });
};
```

## 测试架构

### 测试工具配置
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
});
```

### 测试工具函数
```typescript
// test/utils.tsx
export const renderWithProviders = (
  ui: ReactElement,
  options?: RenderOptions
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};
```

## 部署和环境配置

### 环境变量管理
```typescript
// lib/env.ts
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
] as const;

export const env = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  NODE_ENV: import.meta.env.NODE_ENV,
} as const;

// 验证必需的环境变量
requiredEnvVars.forEach((envVar) => {
  if (!import.meta.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

### Vite 构建优化
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js'],
  },
});
```