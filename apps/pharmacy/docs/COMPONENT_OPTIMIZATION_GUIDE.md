# React 组件性能优化指南

## 优化策略

### 1. 记忆化优化

- 使用 `React.memo` 包装纯组件
- 使用 `useCallback` 记忆化事件处理函数
- 使用 `useMemo` 记忆化计算值

### 2. 组件拆分

- 将大组件拆分为小组件
- 避免不必要的重渲染
- 使用组合模式而非继承

### 3. 状态管理优化

- 将状态放在最近的公共父组件
- 避免过度的状态提升
- 使用 Zustand 管理全局状态

### 4. 渲染优化

- 使用虚拟滚动处理大量数据
- 实施懒加载和代码分割
- 优化条件渲染逻辑

## 性能检查清单

### 组件级别

- [ ] 组件使用 `React.memo` 包装
- [ ] 事件处理函数使用 `useCallback`
- [ ] 计算值使用 `useMemo`
- [ ] Props 类型定义完整
- [ ] 避免内联对象和函数

### 应用级别

- [ ] 路由懒加载
- [ ] 图片懒加载
- [ ] 代码分割
- [ ] Bundle 大小优化
- [ ] 缓存策略

### 数据处理

- [ ] 虚拟滚动大列表
- [ ] 分页加载
- [ ] 防抖和节流
- [ ] 缓存计算结果

## 性能监控

### 开发工具

```bash
# React DevTools Profiler
npm install --save-dev @welldone-software/why-did-you-render

# Bundle 分析
npm run build:analyze
```

### 性能指标

- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- First Input Delay (FID)

## 常见性能问题

### 1. 不必要的重渲染

```typescript
// ❌ 问题代码
const Component = ({ data }) => {
  const processedData = data.filter(item => item.active);
  return <div>{processedData.map(renderItem)}</div>;
};

// ✅ 优化代码
const Component = memo(({ data }) => {
  const processedData = useMemo(
    () => data.filter(item => item.active),
    [data]
  );
  return <div>{processedData.map(renderItem)}</div>;
});
```

### 2. 内联函数和对象

```typescript
// ❌ 问题代码
<Button onClick={() => handleClick(id)} style={{ margin: 10 }} />

// ✅ 优化代码
const handleButtonClick = useCallback(() => handleClick(id), [id]);
const buttonStyle = useMemo(() => ({ margin: 10 }), []);
<Button onClick={handleButtonClick} style={buttonStyle} />
```

### 3. 过度的状态提升

```typescript
// ❌ 问题代码 - 状态在顶层组件
const App = () => {
  const [formData, setFormData] = useState({});
  return <Form data={formData} onChange={setFormData} />;
};

// ✅ 优化代码 - 状态在表单组件内
const Form = () => {
  const [formData, setFormData] = useState({});
  // 表单逻辑
};
```

## 实施步骤

### 阶段 1: 基础优化

1. 为所有组件添加 `React.memo`
2. 优化事件处理函数
3. 记忆化计算值

### 阶段 2: 高级优化

1. 实施虚拟滚动
2. 添加懒加载
3. 优化 Bundle 大小

### 阶段 3: 性能监控

1. 设置性能监控
2. 建立性能基准
3. 持续优化改进

## 测试验证

### 性能测试

```bash
npm run test:performance
npm run lighthouse
```

### 渲染测试

```bash
npm run test:render
```

## 注意事项

1. **过度优化**: 不要过早优化，先测量再优化
2. **可读性**: 保持代码可读性和可维护性
3. **测试**: 确保优化不影响功能正确性
4. **监控**: 持续监控性能指标
