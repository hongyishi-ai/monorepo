# 项目开发标准

## 代码规范

### TypeScript 规范
- 使用严格模式 TypeScript 配置
- 所有函数和变量必须有明确的类型定义
- 优先使用 interface 而不是 type，除非需要联合类型
- 使用 const assertions 和 as const 确保类型安全
- 避免使用 any 类型，使用 unknown 或具体类型

### React 组件规范
- 使用函数组件和 React Hooks
- 组件名使用 PascalCase
- Props 接口以组件名 + Props 命名 (如 LoginFormProps)
- 使用 React.memo 优化性能，但仅在必要时使用
- 自定义 hooks 以 use 开头命名

### 文件和目录命名
- 组件文件使用 PascalCase (如 LoginForm.tsx)
- 工具函数文件使用 kebab-case (如 date-utils.ts)
- 页面组件放在 src/pages 目录
- 可复用组件放在 src/components 目录
- 业务逻辑 hooks 放在 src/hooks 目录

### 状态管理规范
- 使用 Zustand 进行全局状态管理
- 每个 store 分离关注点，避免单一巨大 store
- 使用 useShallow 优化性能，避免不必要的重渲染
- 状态更新使用 immer 模式或返回新对象
- 异步操作在 actions 中处理，不在组件中直接调用

### 数据获取规范
- 使用 React Query 进行服务端状态管理
- 查询 keys 使用数组格式，便于缓存失效
- 实现适当的缓存策略 (staleTime, gcTime)
- 错误处理统一在 QueryClient 配置中处理
- 使用 prefetch 优化用户体验

## 安全规范

### 认证和授权
- 所有 API 调用必须包含认证检查
- 使用 Supabase RLS 策略保护数据访问
- 前端路由保护使用 ProtectedRoute 组件
- 敏感操作需要二次确认

### 数据验证
- 使用 Zod 进行表单数据验证
- 服务端和客户端都要进行数据验证
- 用户输入必须进行清理和转义
- 文件上传需要类型和大小验证

## 性能规范

### 代码分割
- 页面级别使用 React.lazy 懒加载
- 大型组件库按需导入
- 使用 Vite 的动态导入优化打包

### 缓存策略
- React Query 缓存时间根据数据更新频率设置
- 静态资源使用适当的缓存头
- 图片使用 WebP 格式和适当压缩

## 错误处理规范

### 前端错误处理
- 使用 Error Boundary 捕获组件错误
- 网络错误统一在 React Query 中处理
- 用户友好的错误信息展示
- 关键错误需要记录到监控系统

### 表单错误处理
- 实时验证和错误提示
- 服务端验证错误的友好展示
- 防止重复提交

## 测试规范

### 单元测试
- 使用 Vitest 和 Testing Library
- 测试覆盖率目标 80% 以上
- 重点测试业务逻辑和边界情况
- Mock 外部依赖和 API 调用

### 集成测试
- 使用 Playwright 进行 E2E 测试
- 测试关键用户流程
- 测试不同浏览器兼容性

## 文档规范

### 代码注释
- 复杂业务逻辑必须添加注释
- 公共函数和组件添加 JSDoc 注释
- 使用中文注释，便于团队理解

### README 和文档
- 项目 README 包含安装、运行、部署说明
- API 文档使用 OpenAPI 规范
- 组件文档使用 Storybook (如需要)