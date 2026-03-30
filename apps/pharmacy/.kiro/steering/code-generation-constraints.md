# 代码生成约束条件

## 概述
本文档定义了在药房库存管理系统中生成代码时必须遵循的所有约束条件，确保生成的代码能够通过ESLint、TypeScript、Prettier等所有检查工具的验证。

## TypeScript 约束

### 类型安全
- **严格模式**：所有代码必须在TypeScript严格模式下通过编译
- **禁用any**：绝对禁止使用 `any` 类型，使用 `unknown` 或具体类型
- **显式类型**：所有函数参数、返回值、变量必须有明确的类型定义
- **空值检查**：使用 `strictNullChecks`，正确处理 `null` 和 `undefined`
- **未使用变量**：不允许未使用的变量和参数，使用下划线前缀标记故意未使用的参数

### 类型定义规范
```typescript
// ✅ 正确
interface MedicineFormProps {
  medicine?: Medicine;
  onSubmit: (data: CreateMedicineInput) => Promise<void>;
  onCancel: () => void;
}

// ❌ 错误
interface MedicineFormProps {
  medicine: any;
  onSubmit: Function;
}
```

### 导入导出
- 使用ES6模块语法
- 类型导入使用 `import type`
- 路径别名使用 `@/` 前缀

## ESLint 约束

### React 规则
- **Hooks规则**：严格遵循React Hooks规则，正确设置依赖数组
- **组件导出**：使用 `React.memo` 时允许常量导出
- **Props验证**：禁用 `prop-types`，使用TypeScript类型
- **JSX作用域**：不需要显式导入React（使用jsx-runtime）

### 代码质量
- **变量声明**：优先使用 `const`，需要重新赋值时使用 `let`，禁用 `var`
- **未使用变量**：所有变量必须被使用，或使用下划线前缀标记

### 常见错误避免
```typescript
// ✅ 正确
const [data, setData] = useState<Medicine[]>([]);
useEffect(() => {
  fetchData();
}, [fetchData]);

// ❌ 错误
const [data, setData] = useState([]); // 缺少类型
useEffect(() => {
  fetchData();
}, []); // 缺少依赖
```

## Prettier 格式化约束

### 基本格式
- **分号**：语句结尾必须使用分号
- **引号**：使用单引号，JSX中使用单引号
- **缩进**：使用2个空格缩进，不使用制表符
- **行宽**：最大80字符
- **尾随逗号**：ES5兼容的尾随逗号
- **箭头函数**：单参数时省略括号

### 格式示例
```typescript
// ✅ 正确格式
const handleSubmit = async (data: FormData) => {
  try {
    await submitData(data);
    toast({
      title: '提交成功',
      variant: 'success',
    });
  } catch (error) {
    console.error('提交失败:', error);
  }
};
```

## React 组件约束

### 组件结构
- **函数组件**：使用函数组件和Hooks，不使用类组件
- **组件命名**：使用PascalCase，文件名与组件名一致
- **Props接口**：组件Props接口以组件名+Props命名
- **默认导出**：组件使用默认导出，工具函数使用命名导出

### 组件模板
```typescript
interface ComponentNameProps {
  // props定义
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  // 解构props
}) => {
  // 1. Hooks
  // 2. 派生状态
  // 3. 事件处理函数
  // 4. 渲染辅助函数
  // 5. 主渲染
  return (
    // JSX
  );
};

// 或使用memo优化
export const ComponentName = memo<ComponentNameProps>(({
  // props
}) => {
  // 组件逻辑
});
```

### Hooks使用
- **自定义Hooks**：以 `use` 开头命名
- **依赖数组**：useEffect、useCallback、useMemo必须正确设置依赖
- **状态更新**：使用函数式更新避免闭包问题

## 状态管理约束

### Zustand Store
- **Store命名**：以功能领域命名，如 `useAuthStore`、`useScanStore`
- **状态结构**：区分状态和操作，使用TypeScript接口定义
- **异步操作**：在store actions中处理，不在组件中直接调用API

### React Query
- **查询键**：使用数组格式，包含相关参数
- **错误处理**：统一在QueryClient配置中处理
- **缓存策略**：根据数据更新频率设置合适的staleTime

## 业务逻辑约束

### 药房业务规则
- **条码验证**：所有条码必须通过 `validateBarcode` 函数验证
- **库存计算**：使用业务规则计算库存，不允许负数
- **权限检查**：使用 `checkPermission` 函数验证用户权限
- **日期处理**：使用 `date-fns` 库处理日期，注意时区

### 数据验证
- **表单验证**：使用Zod schema验证
- **API数据**：验证从API返回的数据结构
- **用户输入**：清理和验证所有用户输入

## UI/UX 约束

### 组件库使用
- **Shadcn/ui**：优先使用项目中的UI组件，避免自定义样式
- **Tailwind CSS**：使用Tailwind类名，避免内联样式
- **响应式设计**：使用响应式断点类名

### 颜色和样式
- **语义化颜色**：使用设计系统中定义的颜色变量
- **状态颜色**：库存状态、有效期状态使用规定的颜色
- **间距系统**：使用4px倍数的间距

### 可访问性
- **语义化HTML**：使用正确的HTML标签
- **ARIA属性**：为交互元素提供适当的ARIA标签
- **键盘导航**：确保所有交互元素可键盘访问

## 性能约束

### 渲染优化
- **React.memo**：对纯展示组件使用memo优化
- **useCallback**：缓存事件处理函数
- **useMemo**：缓存计算结果
- **懒加载**：大型组件使用React.lazy

### 代码分割
- **路由分割**：页面组件使用懒加载
- **组件分割**：大型功能组件按需加载

## 错误处理约束

### 错误边界
- **组件错误**：使用ErrorBoundary包装关键组件
- **异步错误**：使用try/catch处理异步操作
- **用户友好**：提供清晰的错误信息和恢复建议

### 日志记录
- **错误日志**：记录所有错误到控制台
- **用户操作**：记录关键用户操作用于调试

## 测试约束

### 测试覆盖
- **组件测试**：使用Testing Library测试组件行为
- **Hooks测试**：测试自定义hooks的逻辑
- **集成测试**：测试关键用户流程

### 测试规范
- **测试文件**：与源文件同目录，使用.test.tsx后缀
- **测试描述**：使用清晰的describe和it描述
- **Mock数据**：使用真实的数据结构进行测试

## 文件和目录约束

### 文件命名
- **组件文件**：PascalCase.tsx
- **工具文件**：kebab-case.ts
- **类型文件**：kebab-case.types.ts
- **测试文件**：原文件名.test.tsx

### 目录结构
- **组件**：按功能分组到相应目录
- **页面**：放在src/pages目录
- **工具**：放在src/utils目录
- **类型**：放在src/types目录

## 安全约束

### 数据安全
- **输入验证**：验证所有用户输入
- **权限检查**：在组件和API层都进行权限验证
- **敏感信息**：不在前端存储敏感信息

### API安全
- **认证头**：所有API请求包含认证信息
- **错误处理**：不暴露敏感的错误信息

## 代码生成检查清单

在生成任何代码前，确保：

### TypeScript检查
- [ ] 所有类型定义明确
- [ ] 没有使用any类型
- [ ] 导入语句正确
- [ ] 接口和类型命名规范

### ESLint检查
- [ ] 没有未使用的变量
- [ ] React Hooks规则正确
- [ ] 代码质量规则通过

### Prettier检查
- [ ] 代码格式符合配置
- [ ] 缩进和引号正确
- [ ] 行宽不超过限制

### 业务逻辑检查
- [ ] 遵循药房业务规则
- [ ] 权限检查正确
- [ ] 数据验证完整

### UI/UX检查
- [ ] 使用项目UI组件
- [ ] 响应式设计
- [ ] 可访问性支持

### 性能检查
- [ ] 适当的优化措施
- [ ] 避免不必要的重渲染
- [ ] 合理的代码分割

## 常见错误和解决方案

### TypeScript错误
```typescript
// 错误：使用any
const data: any = response.data;

// 正确：使用具体类型
const data: Medicine[] = response.data;
```

### React错误
```typescript
// 错误：缺少依赖
useEffect(() => {
  fetchData(id);
}, []);

// 正确：包含所有依赖
useEffect(() => {
  fetchData(id);
}, [id, fetchData]);
```

### 格式错误
```typescript
// 错误：格式不规范
const obj={name:"test",value:123}

// 正确：符合Prettier规范
const obj = { name: 'test', value: 123 };
```

## 总结

遵循这些约束条件可以确保生成的代码：
1. 通过所有静态检查工具验证
2. 符合项目的代码规范和最佳实践
3. 具有良好的可维护性和可读性
4. 满足业务需求和用户体验要求

在生成代码时，请将此文档作为检查清单，确保每一项约束都得到满足。