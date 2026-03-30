# Shared UI Components

本规范定义了红医师共享 UI 组件库 `@hongyishi/ui` 的组件范围、设计令牌以及各 app 的 UI 库使用情况。

## ADDED Requirements

### Requirement: Shared Component Library Scope

`@hongyishi/ui` (`packages/ui`) SHALL 提供跨应用共享的基础 UI 组件，以 TypeScript + React 实现，版本 `0.1.0`。所有组件必须与统一后的 React 版本（React 19 stable）兼容（参见 architecture-decisions/spec.md）。

#### Scenario: Button Component Across Apps

- GIVEN 开发者需要在 fms 应用中引入按钮组件
- WHEN 在代码中写入 `import { Button } from '@hongyishi/ui'`
- THEN Button 组件渲染正常，支持 `variant`（primary/secondary/danger/ghost）和 `size`（sm/md/lg）属性
- AND 在 pharmacy 和 clinic 中同样可用，无需重复实现

#### Scenario: Card Component Usage

- GIVEN clinic 应用需要在页面中展示患者信息卡片
- WHEN 使用 `import { Card, CardHeader, CardBody } from '@hongyishi/ui'`
- THEN 卡片组件提供统一的圆角、阴影、边框样式
- AND 开发者不需要从各自 app 的 node_modules 中寻找或复制 Card 代码

#### Scenario: Form Input Components

- GIVEN pharmacy 应用中有药品搜索表单
- WHEN 使用 `import { Input, Select, Checkbox } from '@hongyishi/ui'`
- THEN 这些表单组件与 Radix UI 的底层 primitive 协同工作
- AND 统一的验证错误提示样式在所有 apps 中保持一致

---

### Requirement: Design Token System

`@hongyishi/ui` SHALL 通过 Tailwind CSS 配置和 CSS 变量提供统一的设计令牌。

#### Scenario: Consistent Color Palette

- GIVEN 开发者需要为 portal 主页添加强调色
- WHEN 使用 `bg-primary-500` 或 CSS variable `--color-primary`
- THEN 所有 apps（portal、pharmacy、clinic、fms、heat-stroke）共享同一套主题色
- AND 主色为 `#0ea5e9`（sky-500），各色阶（50/100/500/600/700）跨应用一致

#### Scenario: Unified Typography

- GIVEN 需要在 fms 中展示中文医学术语
- WHEN 使用 Tailwind 的 `font-sans` class
- THEN 字体回退链为 `Noto Sans SC, system-ui, sans-serif`
- AND 所有 app 中中英文混排的视觉体验统一

#### Scenario: Responsive Layout Tokens

- GIVEN 需要在 clinic 中实现响应式布局
- WHEN 使用 Tailwind 的 breakpoint classes（sm:/md:/lg:/xl:）
- THEN 断点定义在 `@hongyishi/config/tailwind` 中统一管理
- AND 各 app 不需要独立维护 breakpoint 配置

---

### Requirement: Per-App UI Library Usage

各 app 当前使用的 UI 库 MUST be documented（基于 package.json 依赖分析）。

#### Scenario: Radix UI Apps Documentation

- GIVEN pharmacy 和 fms 都重度依赖 Radix UI
- WHEN 查看 `apps/*/package.json` 中的 dependencies
- THEN pharmacy 有 19 个 @radix-ui/react-*，clinic 和 fms 各有 26 个
- AND heat-stroke 和 portal 无 Radix UI 依赖

#### Scenario: Non-Radix App Using Shared Components

- GIVEN heat-stroke 是一个更轻量的应用，无 UI 库依赖
- WHEN 该应用需要基础 Button 组件
- THEN `@hongyishi/ui` 应提供不依赖 Radix 的纯 CSS/HTML 实现版本
- AND heat-stroke 可以引入共享组件而不被迫引入 Radix 依赖

---

### Requirement: Component Publishing and Export

`@hongyishi/ui` SHALL 通过 `exports` field 支持按需引入。

#### Scenario: Named Export Consumption

- GIVEN 开发者只需要 Button 而不需要其他组件
- WHEN 写入 `import { Button } from '@hongyishi/ui/components/button'`
- THEN 仅 Button 的代码被打包（tree-shaking）
- AND 不会引入整个 ui 库的全部组件代码
