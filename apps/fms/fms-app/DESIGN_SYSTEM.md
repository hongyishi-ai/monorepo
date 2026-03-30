# FMS 设计系统规范

## 概述
FMS功能性动作筛查系统采用**布鲁克林极简主义**设计风格，灵感来源于OpenAI的设计理念，强调简洁、功能性和优雅的用户体验。

## 设计原则

### 1. 极简主义
- 去除不必要的装饰元素
- 专注于内容和功能
- 大量留白营造呼吸感
- 简洁的交互模式

### 2. 功能性
- 设计服务于功能
- 清晰的信息层次
- 直观的操作流程
- 高效的用户体验

### 3. 一致性
- 统一的视觉语言
- 标准化的组件库
- 一致的交互模式
- 统一的字体和颜色系统

## 字体系统

### 字体大小规范
```css
/* 基础字体 */
body: 1.125rem (18px)  /* 调大一号 */

/* 标题系统 */
.brooklyn-title: clamp(2.5rem, 5vw, 3.5rem)  /* 主标题 */
.brooklyn-subtitle: clamp(1.25rem, 2.5vw, 1.375rem)  /* 副标题 */
.brooklyn-text: 1.125rem  /* 正文 */

/* 移动端适配 */
@media (max-width: 768px) {
  .brooklyn-title: 2rem
  .brooklyn-subtitle: 1.125rem
  .brooklyn-text: 1rem
}
```

### 字重规范
- **极细**: font-weight: 300 (主要用于标题)
- **常规**: font-weight: 400 (按钮和强调文本)
- **中等**: font-weight: 500 (小标题)

## 颜色系统

### 主色调
```css
--primary: 240 10% 25%        /* 深灰主色 */
--background: 0 0% 98%        /* 温暖米白背景 */
--foreground: 240 10% 15%     /* 深炭灰文字 */
--muted-foreground: 240 5% 45% /* 辅助文字 */
--accent: 25 35% 88%          /* 温暖米色强调 */
--border: 240 5% 88%          /* 浅灰边框 */
```

### 语义化颜色
- **成功**: 绿色系 (用于完成状态)
- **警告**: 琥珀色系 (用于注意提醒)
- **错误**: 红色系 (用于疼痛警告)
- **信息**: 蓝色系 (用于信息提示)

## 间距系统

### 布局间距
```css
/* 页面级间距 */
.brooklyn-section: clamp(2rem, 6vw, 8rem) 0  /* 上下间距 */
.brooklyn-container: 0 clamp(1rem, 3vw, 2rem)  /* 左右内边距 */

/* 组件间距 */
.brooklyn-grid: clamp(1.5rem, 3vw, 3rem)  /* 网格间距 */

/* 移动端优化 */
@media (max-width: 768px) {
  .brooklyn-section: 2rem 0
  .brooklyn-container: 0 1rem
  .brooklyn-grid: 1.5rem
}
```

### 组件内间距
- **紧凑**: 0.5rem (8px)
- **标准**: 1rem (16px)
- **宽松**: 1.5rem (24px)
- **超宽松**: 2rem (32px)

## 组件规范

### 按钮系统
```css
.brooklyn-button {
  font-size: 1.125rem;           /* 调大字体 */
  font-weight: 400;
  letter-spacing: 0.01em;
  border-radius: 4px;            /* 极小圆角 */
  transition: all 0.2s ease;
}
```

**变体**:
- `primary`: 主要操作按钮
- `outline`: 次要操作按钮
- `ghost`: 文本按钮

### 卡片系统
```css
.brooklyn-card {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.brooklyn-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}
```

### 导航系统
```css
.brooklyn-nav {
  background: hsl(var(--background));
  border-bottom: 1px solid hsl(var(--border));
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 50;
}

.brooklyn-nav-link {
  font-size: 1.125rem;
  font-weight: 300;
  transition: all 0.2s ease;
}
```

## 响应式设计

### 断点系统
- **移动端**: < 768px
- **平板端**: 768px - 1024px
- **桌面端**: > 1024px

### 移动端优化原则
1. **减少留白**: 紧凑但不拥挤的布局
2. **触摸友好**: 按钮和链接至少44px高度
3. **单列布局**: 避免复杂的多列布局
4. **适当字体**: 确保在小屏幕上的可读性

### 容器宽度
```css
.brooklyn-container {
  max-width: 1200px;        /* 标准页面 */
  max-width: 1400px;        /* 宽屏页面(如报告) */
}
```

## 动画效果

### 过渡动画
```css
/* 标准过渡 */
transition: all 0.2s ease;

/* 悬停效果 */
transition: all 0.3s ease;

/* 页面进入动画 */
.minimal-fade-in {
  animation: minimalFadeIn 0.6s ease-out;
}
```

### 动画原则
- **微妙**: 不干扰用户注意力
- **快速**: 持续时间不超过0.6秒
- **有意义**: 提供视觉反馈和引导

## 可访问性

### 对比度要求
- **正文文字**: 至少4.5:1
- **大号文字**: 至少3:1
- **交互元素**: 至少3:1

### 键盘导航
- 所有交互元素可通过Tab键访问
- 清晰的焦点指示器
- 逻辑的Tab顺序

### 屏幕阅读器
- 语义化的HTML结构
- 适当的ARIA标签
- 有意义的alt文本

## 组件使用指南

### 页面结构
```jsx
<div className="brooklyn-section">
  <div className="brooklyn-container max-w-6xl">
    {/* 页面标题 */}
    <div className="text-center mb-16 md:mb-20 minimal-fade-in">
      <h1 className="brooklyn-title">页面标题</h1>
      <p className="brooklyn-subtitle">页面描述</p>
    </div>
    
    {/* 页面内容 */}
    {/* ... */}
  </div>
</div>
```

### 卡片布局
```jsx
<Card className="brooklyn-card">
  <CardContent className="p-8 md:p-12">
    {/* 卡片内容 */}
  </CardContent>
</Card>
```

### 按钮使用
```jsx
<Button className="brooklyn-button">
  主要操作
</Button>

<Button variant="outline" className="brooklyn-button">
  次要操作
</Button>
```

## 最佳实践

### DO ✅
- 使用标准化的类名和组件
- 保持一致的间距和字体
- 优先考虑移动端体验
- 使用语义化的HTML
- 测试可访问性

### DON'T ❌
- 不要使用内联样式
- 不要破坏响应式布局
- 不要忽略移动端适配
- 不要使用过度的动画效果
- 不要忽略颜色对比度

## 维护指南

### 新增组件
1. 遵循现有的命名规范
2. 确保响应式适配
3. 测试各种屏幕尺寸
4. 验证可访问性

### 样式修改
1. 优先使用CSS变量
2. 保持设计系统一致性
3. 测试影响范围
4. 更新相关文档

这个设计系统确保了FMS项目在保持专业性的同时，提供优雅、一致且用户友好的体验。 