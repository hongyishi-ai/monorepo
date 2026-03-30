# TanStack Query 集成计划

## 🎯 集成目标

为FMS项目集成TanStack Query (React Query)，实现专业的服务端状态管理，符合**服务端状态缓存原则**。

## 📋 当前状态分析

### 现有数据流
- **本地存储**: IndexedDB (主) + localStorage (备份)
- **状态管理**: Zustand stores
- **数据处理**: 自定义Hook (`useStorage`, `useReportData`)

### 未来API需求
- 用户认证和会话管理
- 评估数据云端同步
- 历史记录备份/恢复
- 数据分析和统计
- 专业报告生成

## 🚀 集成策略

### 阶段一：基础设施搭建 (1周)

#### 1. 安装和配置
```bash
npm install @tanstack/react-query
npm install @tanstack/react-query-devtools
```

#### 2. QueryClient 配置
```typescript
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 缓存时间 5分钟
      staleTime: 5 * 60 * 1000,
      // 保持在后台的时间 30分钟
      gcTime: 30 * 60 * 1000,
      // 错误重试
      retry: (failureCount, error) => {
        // 4xx错误不重试
        if (error instanceof Error && error.message.includes('4')) {
          return false
        }
        return failureCount < 3
      },
      // 重新获取策略
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always'
    },
    mutations: {
      // 突变错误重试
      retry: 1
    }
  }
})
```

#### 3. 根组件包装
```typescript
// main.tsx
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './lib/query-client'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        {/* 现有组件 */}
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

### 阶段二：本地存储查询化 (1-2周)

#### 1. 创建查询Hook
```typescript
// hooks/queries/useAssessmentQueries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useStorage } from '@/hooks/use-storage'
import type { AssessmentRecord } from '@/lib/storage'

// 查询所有评估记录
export const useAssessments = () => {
  const { getAllAssessments } = useStorage()
  
  return useQuery({
    queryKey: ['assessments'],
    queryFn: getAllAssessments,
    staleTime: 1 * 60 * 1000, // 1分钟内认为数据新鲜
  })
}

// 查询单个评估记录
export const useAssessment = (id: number) => {
  const { getAssessmentById } = useStorage()
  
  return useQuery({
    queryKey: ['assessments', id],
    queryFn: () => getAssessmentById(id),
    enabled: !!id,
  })
}

// 保存评估记录
export const useSaveAssessment = () => {
  const { saveAssessment } = useStorage()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: saveAssessment,
    onSuccess: (newAssessment) => {
      // 更新评估列表缓存
      queryClient.setQueryData(
        ['assessments'],
        (old: AssessmentRecord[] = []) => [newAssessment, ...old]
      )
      
      // 设置单个记录缓存
      queryClient.setQueryData(['assessments', newAssessment.id], newAssessment)
      
      // 可选：标记相关查询为过期
      queryClient.invalidateQueries({ queryKey: ['assessments-stats'] })
    },
  })
}

// 删除评估记录
export const useDeleteAssessment = () => {
  const { deleteAssessment } = useStorage()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteAssessment,
    onSuccess: (_, deletedId) => {
      // 从列表中移除
      queryClient.setQueryData(
        ['assessments'],
        (old: AssessmentRecord[] = []) => 
          old.filter(item => item.id !== deletedId)
      )
      
      // 移除单个记录缓存
      queryClient.removeQueries({ queryKey: ['assessments', deletedId] })
    },
  })
}
```

#### 2. 统计数据查询
```typescript
// hooks/queries/useStatisticsQueries.ts
export const useAssessmentStatistics = () => {
  const { getAllAssessments } = useStorage()
  
  return useQuery({
    queryKey: ['assessments-stats'],
    queryFn: async () => {
      const assessments = await getAllAssessments()
      return {
        total: assessments.length,
        starred: assessments.filter(a => a.isStarred).length,
        avgScore: assessments.reduce((sum, a) => sum + a.totalScore, 0) / assessments.length || 0,
        recentAssessments: assessments.slice(0, 5)
      }
    },
    staleTime: 2 * 60 * 1000, // 2分钟
  })
}
```

### 阶段三：组件重构 (1周)

#### 1. 历史记录页面重构
```typescript
// pages/HistoryPage.tsx
import { useAssessments, useDeleteAssessment } from '@/hooks/queries/useAssessmentQueries'

const HistoryPage = () => {
  const { data: assessments, isLoading, error } = useAssessments()
  const deleteMutation = useDeleteAssessment()
  
  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id)
      // 自动更新UI，无需手动刷新
    } catch (error) {
      console.error('删除失败:', error)
    }
  }
  
  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  
  return (
    <div>
      {assessments?.map(assessment => (
        <AssessmentCard 
          key={assessment.id} 
          assessment={assessment}
          onDelete={() => handleDelete(assessment.id)}
          isDeleting={deleteMutation.isPending}
        />
      ))}
    </div>
  )
}
```

#### 2. 首页统计重构
```typescript
// pages/HomePage.tsx
import { useAssessmentStatistics } from '@/hooks/queries/useStatisticsQueries'

const HomePage = () => {
  const { data: stats, isLoading } = useAssessmentStatistics()
  
  return (
    <div>
      <StatsOverview 
        stats={stats} 
        isLoading={isLoading} 
      />
      {/* 其他组件 */}
    </div>
  )
}
```

### 阶段四：离线优化 (1周)

#### 1. 离线突变队列
```typescript
// lib/offline-manager.ts
import { onlineManager } from '@tanstack/react-query'

// 监听网络状态
onlineManager.setEventListener((setOnline) => {
  window.addEventListener('online', () => setOnline(true))
  window.addEventListener('offline', () => setOnline(false))
  
  return () => {
    window.removeEventListener('online', () => setOnline(true))
    window.removeEventListener('offline', () => setOnline(false))
  }
})
```

#### 2. 乐观更新
```typescript
export const useSaveAssessmentOptimistic = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: saveAssessment,
    // 乐观更新
    onMutate: async (newAssessment) => {
      // 取消相关的外出查询
      await queryClient.cancelQueries({ queryKey: ['assessments'] })
      
      // 获取当前数据快照
      const previousData = queryClient.getQueryData(['assessments'])
      
      // 乐观更新
      queryClient.setQueryData(['assessments'], (old: AssessmentRecord[] = []) => 
        [{ ...newAssessment, id: Date.now() }, ...old]
      )
      
      return { previousData }
    },
    // 回滚
    onError: (err, newAssessment, context) => {
      queryClient.setQueryData(['assessments'], context?.previousData)
    },
    // 最终同步
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] })
    },
  })
}
```

## 🔮 未来API集成准备

### API服务配置
```typescript
// lib/api-client.ts
import axios from 'axios'

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 10000,
})

// 请求拦截器 - 添加认证
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器 - 错误处理
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 处理认证失效
      localStorage.removeItem('auth-token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

### API查询Hook模板
```typescript
// hooks/queries/useCloudSync.ts (未来使用)
export const useCloudSync = () => {
  return useQuery({
    queryKey: ['cloud-sync-status'],
    queryFn: () => apiClient.get('/sync/status').then(res => res.data),
    enabled: !!localStorage.getItem('auth-token'),
  })
}

export const useSyncToCloud = () => {
  return useMutation({
    mutationFn: (assessments: AssessmentRecord[]) => 
      apiClient.post('/sync/upload', { assessments }),
    onSuccess: () => {
      // 更新同步状态
    }
  })
}
```

## 📈 预期收益

### 开发体验
- **缓存管理**: 自动化的智能缓存
- **加载状态**: 统一的loading/error状态
- **开发工具**: React Query DevTools调试
- **代码复用**: 查询逻辑标准化

### 性能提升
- **智能缓存**: 减少重复数据获取
- **后台更新**: 无感知的数据同步
- **乐观更新**: 即时的用户反馈

### 可维护性
- **关注点分离**: 数据获取与UI逻辑分离
- **错误处理**: 统一的错误处理策略
- **类型安全**: 完整的TypeScript支持

## ⚡ 实施建议

1. **渐进式集成**: 从历史记录页面开始
2. **保持兼容**: 现有useStorage Hook作为过渡
3. **充分测试**: 每个查询都要有对应测试
4. **性能监控**: 使用DevTools监控缓存效果

这个集成将使FMS项目的数据管理更加专业和高效，为未来的API集成奠定坚实基础。 