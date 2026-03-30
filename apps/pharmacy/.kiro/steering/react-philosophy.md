---
inclusion: fileMatch
fileMatchPattern: ['**/*.tsx', '**/*.ts']
---

# React 开发哲学

## 组件设计原则

### 单一职责
- 每个组件应专注于单一功能或职责
- 大型组件应拆分为多个小型、可复用的组件
- 遵循"做一件事，做好这件事"的原则

### 组件分类
- **展示组件**：专注于 UI 渲染，不包含业务逻辑
- **容器组件**：处理数据获取和状态管理
- **页面组件**：组合多个组件形成完整页面
- **布局组件**：处理页面结构和排版

### 组件命名
- 使用 PascalCase 命名组件
- 名称应清晰表达组件功能
- 页面组件以 Page 结尾（如 `DashboardPage`）
- 通用 UI 组件使用简洁名称（如 `Button`、`Card`）
- 业务组件使用描述性名称（如 `MedicineForm`、`BatchList`）

## 状态管理

### 状态分类
- **本地状态**：使用 `useState` 管理组件内部状态
- **共享状态**：使用 Zustand 管理跨组件状态
- **服务端状态**：使用 React Query 管理 API 数据

### 状态设计原则
- 将状态尽可能保持在最低必要层级
- 避免重复或冗余的状态
- 使用派生状态代替存储计算结果
- 区分 UI 状态和业务数据状态

### Zustand 最佳实践
- 按功能领域划分 store（认证、通知、扫码等）
- 使用 immer 简化状态更新逻辑
- 使用 `useShallow` 优化渲染性能
- 异步操作放在 store actions 中处理

## Hooks 使用规范

### 自定义 Hooks
- 以 `use` 开头命名
- 专注于特定功能或数据源
- 返回值使用数组或对象解构
- 处理加载、错误和数据状态

### React Query Hooks
- 查询键使用数组格式，便于缓存管理
- 实现适当的重试和错误处理策略
- 使用 `useQuery` 获取数据，`useMutation` 修改数据
- 合理设置 `staleTime` 和 `cacheTime`

### 常见 Hooks 模式
```typescript
// 数据获取 Hook
const useMedicines = (filters?: MedicineFilters) => {
  return useQuery({
    queryKey: ['medicines', filters],
    queryFn: () => MedicineService.getMedicines(filters),
    staleTime: 5 * 60 * 1000, // 5分钟
  });
};

// 表单处理 Hook
const useMedicineForm = (initialData?: Medicine) => {
  const [formData, setFormData] = useState(initialData || defaultMedicine);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  return { formData, handleChange };
};
```

## 性能优化

### 渲染优化
- 使用 `React.memo` 避免不必要的重渲染
- 使用 `useCallback` 和 `useMemo` 缓存函数和计算值
- 使用虚拟列表（如 `react-window`）处理长列表
- 避免在渲染期间创建新函数或对象

### 代码分割
- 使用 `React.lazy` 和 `Suspense` 实现组件懒加载
- 按路由分割代码，减少初始加载时间
- 大型第三方库按需导入

### 常见性能问题
- 避免过度使用 Context API
- 避免在循环中使用 index 作为 key
- 避免不必要的状态更新
- 避免过深的组件树层级

## 副作用处理

### useEffect 使用规范
- 明确定义依赖数组，避免遗漏依赖
- 避免在 `useEffect` 中直接修改状态
- 清理定时器、事件监听器等资源
- 避免过于复杂的 `useEffect` 逻辑

### 常见副作用模式
```typescript
// 数据获取
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await api.getData();
      setData(data);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
}, []);

// 事件监听
useEffect(() => {
  const handleResize = () => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  };
  
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

## 错误处理

### 错误边界
- 使用 ErrorBoundary 组件捕获渲染错误
- 为关键功能区域设置单独的错误边界
- 提供用户友好的错误恢复机制

### 异步错误处理
- 使用 try/catch 处理异步操作错误
- 使用 React Query 的错误处理机制
- 全局错误处理与用户通知

## 表单处理

### 表单状态管理
- 使用受控组件管理表单状态
- 复杂表单考虑使用 React Hook Form
- 表单验证使用 Zod 或 Yup

### 表单提交
- 防止重复提交
- 提供加载状态反馈
- 表单错误显示在相应字段旁

## 测试策略

### 组件测试
- 使用 Testing Library 测试组件行为
- 测试用户交互而非实现细节
- 模拟 API 调用和外部依赖

### 测试覆盖范围
- 关键业务组件优先测试
- 测试边界条件和错误处理
- 测试用户流程和交互

## 可访问性

### 基本原则
- 使用语义化 HTML 元素
- 提供适当的 ARIA 属性
- 确保键盘可访问性
- 支持屏幕阅读器

### 常见实践
- 图片提供 alt 文本
- 表单元素关联 label
- 颜色对比度符合 WCAG 标准
- 动态内容变化通知屏幕阅读器

## 国际化

### 文本管理
- 使用 i18n 库管理翻译文本
- 避免硬编码文本字符串
- 支持日期、数字、货币等本地化格式

### 方向性支持
- 考虑从右到左（RTL）语言支持
- 使用相对定位和 CSS 逻辑属性

## 代码风格

### JSX 规范
- 使用自闭合标签（如 `<Input />`）
- 多行 JSX 使用括号包裹
- Props 按字母顺序排列
- 条件渲染使用三元运算符或逻辑与（&&）

### 组件结构
```typescript
// 推荐的组件结构
const MedicineItem: React.FC<MedicineItemProps> = ({ medicine, onEdit, onDelete }) => {
  // 1. Hooks
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 2. 派生状态
  const isLowStock = medicine.quantity < medicine.safetyStock;
  
  // 3. 事件处理函数
  const handleToggle = () => setIsExpanded(prev => !prev);
  
  // 4. 渲染辅助函数
  const renderStockStatus = () => (
    <Badge variant={isLowStock ? "warning" : "success"}>
      {isLowStock ? "库存不足" : "库存充足"}
    </Badge>
  );
  
  // 5. 主渲染函数
  return (
    <Card>
      <CardHeader>
        <CardTitle>{medicine.name}</CardTitle>
        {renderStockStatus()}
      </CardHeader>
      <CardContent>
        {/* 内容 */}
      </CardContent>
      <CardFooter>
        <Button onClick={() => onEdit(medicine.id)}>编辑</Button>
        <Button variant="destructive" onClick={() => onDelete(medicine.id)}>删除</Button>
      </CardFooter>
    </Card>
  );
};
```