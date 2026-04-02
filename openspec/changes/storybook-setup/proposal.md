## Why

`@hongyishi/ui` 已初始化共享组件库，但缺少 Storybook 导致组件无法独立预览、测试和文档化。新组件开发依赖 pharmacy app 运行，效率低且难以进行视觉回归测试。

## What Changes

- 在 `packages/ui` 配置 Storybook 8
- 为 Button、Card、Form（Input/Select/Label）、Layout（Container/Stack）编写 Stories
- 配置 @chromatic-como/test 进行视觉回归测试
- 将 Storybook 发布到 GitHub Pages 或 Chromatic

## Capabilities

### New Capabilities

- `storybook-setup`: 为 `@hongyishi/ui` 组件库配置 Storybook 开发环境，包括组件 Stories、主题配置和 CI 视觉测试

## Impact

- 新增 `packages/ui/.storybook/` 配置目录
- 新增 `packages/ui/stories/` 目录存放 Stories
- 新增 `@storybook/*` + `@chromatic-como/test` devDependencies
- 影响 `packages/ui` 包
