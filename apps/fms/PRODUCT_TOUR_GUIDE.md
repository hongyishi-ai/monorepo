# 产品引导系统使用指南

## 概述

FMS系统的产品引导功能为首次用户提供专业的功能介绍和使用指导，帮助用户快速了解系统功能并提升产品采用率。

## 组件架构

### 1. 核心组件

- **ProductTour**: 主要的引导组件，负责显示引导步骤和处理用户交互
- **useProductTour**: 自定义Hook，管理引导状态和逻辑
- **TourHelpButton**: 通用的帮助按钮组件，可在任何页面使用

### 2. 配置文件

- **tour-config.ts**: 包含所有页面的引导步骤配置
- **tourConfigs**: 按页面组织的引导配置对象

## 使用方法

### 基础用法

引导系统已经集成到 `FirstVisitDetector` 中，会在用户首次访问时自动触发。

```typescript
// FirstVisitDetector.tsx 中的集成
import { ProductTour } from '@/components/ui/product-tour';
import { useProductTour } from '@/hooks/useProductTour';

const {
  isOpen,
  currentPageTour,
  closeTour
} = useProductTour();

return (
  <>
    {children}
    <ProductTour
      isOpen={isOpen}
      onRequestClose={closeTour}
      config={currentPageTour}
    />
  </>
);
```

### 手动启动引导

在页面中添加手动启动引导的按钮：

```typescript
import { useProductTour } from '@/hooks/useProductTour';
import { TourHelpButton } from '@/components/ui/tour-help-button';

const MyPage = () => {
  const { startTourManually } = useProductTour();

  return (
    <div>
      {/* 方式1：使用Hook */}
      <Button onClick={() => startTourManually('home')}>
        产品引导
      </Button>

      {/* 方式2：使用通用组件 */}
      <TourHelpButton pageName="home" showText />

      {/* 方式3：自动检测当前页面 */}
      <TourHelpButton />
    </div>
  );
};
```

## 配置引导步骤

### 添加新页面的引导

1. 在 `tour-config.ts` 中添加新的引导步骤：

```typescript
export const newPageTourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: '欢迎来到新页面',
    description: '这里是新页面的功能介绍...',
    placement: 'center',
    content: (
      <div className="text-sm">
        <p>详细的介绍内容</p>
      </div>
    )
  },
  {
    id: 'main-feature',
    title: '主要功能',
    description: '点击这里可以访问主要功能...',
    target: '#main-button',
    placement: 'bottom',
    spotlightPadding: 12,
    highlightColor: 'rgba(34, 197, 94, 0.3)',
    action: {
      label: '试试看',
      onClick: () => {
        // 执行相关操作
      }
    }
  }
];
```

2. 将新配置添加到 `tourConfigs` 对象：

```typescript
export const tourConfigs: Record<string, TourConfig> = {
  // ... 其他配置
  newPage: {
    steps: newPageTourSteps,
    showProgress: true,
    showSkip: true,
    showNavigation: true,
    continuous: true,
    locale: {
      skip: '跳过引导',
      next: '下一步',
      back: '上一步',
      last: '完成'
    }
  }
};
```

### 引导步骤配置选项

```typescript
interface TourStep {
  id: string;                    // 步骤唯一标识
  title: string;                 // 步骤标题
  description: string;           // 步骤描述
  content?: React.ReactNode;     // 额外的内容组件
  target?: string;               // 目标元素的CSS选择器
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  spotlightPadding?: number;     // 高亮区域的内边距
  highlightColor?: string;       // 高亮边框颜色
  action?: {                     // 可选的操作按钮
    label: string;
    onClick: () => void;
  };
  disableBeacon?: boolean;       // 禁用信标动画
  allowClicksThruHole?: boolean; // 允许点击穿透高亮区域
}
```

## 响应式设计

引导系统已经优化了响应式设计：

- **移动端适配**: 自动调整卡片大小和位置
- **布局调整**: 左右布局在移动端自动转换为上下布局
- **触摸优化**: 支持触摸操作和手势导航

## 用户偏好管理

### 检查用户状态

```typescript
const {
  isFirstTimeUser,
  shouldShowTour,
  getTourStats
} = useProductTour();

// 检查是否是首次用户
if (isFirstTimeUser) {
  // 显示特殊的首次用户界面
}

// 获取引导统计信息
const stats = getTourStats();
console.log('引导完成率:', stats.completionRate);
```

### 重置引导状态

```typescript
const { resetTour } = useProductTour();

// 重置所有引导状态，用于测试或用户要求重新体验
resetTour();
```

## 最佳实践

### 1. 引导内容设计

- **简洁明了**: 每个步骤的描述要简洁，避免信息过载
- **渐进式披露**: 分步骤介绍功能，不要一次性展示太多
- **视觉层次**: 使用图标、色彩和布局创建清晰的视觉层次

### 2. 目标元素选择

- **稳定的选择器**: 使用稳定的CSS选择器，避免因样式变化导致目标丢失
- **可见性检查**: 确保目标元素在引导时是可见的
- **适当的内边距**: 为高亮区域设置适当的内边距，避免过于紧密

### 3. 交互设计

- **清晰的操作指示**: 明确告诉用户下一步要做什么
- **灵活的控制**: 提供跳过、返回等多种操作选项
- **键盘支持**: 支持键盘导航，提升可访问性

## 调试和测试

### 开发环境测试

1. 清除本地存储中的引导状态：
```javascript
localStorage.removeItem('fms_tour_completed');
localStorage.removeItem('fms_tour_skipped');
localStorage.removeItem('fms_tour_preferences');
```

2. 使用URL参数跳过开场动画：
```
http://localhost:3000?skip_opening=true
```

3. 手动启动引导：
```typescript
const { startTourManually } = useProductTour();
startTourManually('home'); // 启动首页引导
```

### 常见问题排查

1. **引导不显示**: 检查是否已经完成过引导或目标元素是否存在
2. **定位错误**: 确认目标元素的CSS选择器是否正确
3. **响应式问题**: 测试不同屏幕尺寸下的显示效果

## 扩展功能

### 自定义引导主题

可以通过修改CSS变量来自定义引导的视觉效果：

```css
.tour-card {
  --tour-bg: rgba(255, 255, 255, 0.95);
  --tour-border: 2px solid rgba(0, 0, 0, 0.1);
  --tour-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
```

### 添加分析追踪

```typescript
const tourConfig = {
  steps: mySteps,
  onComplete: () => {
    // 追踪引导完成事件
    analytics.track('tour_completed', {
      page: 'home',
      steps_completed: mySteps.length
    });
  },
  onSkip: () => {
    // 追踪引导跳过事件
    analytics.track('tour_skipped', {
      page: 'home',
      step_when_skipped: currentStep
    });
  }
};
```

## 总结

产品引导系统为FMS项目提供了专业的用户入门体验，通过智能的触发机制、丰富的配置选项和响应式设计，帮助用户快速掌握系统功能。系统设计遵循了非侵入式的原则，不会影响现有功能的正常使用。