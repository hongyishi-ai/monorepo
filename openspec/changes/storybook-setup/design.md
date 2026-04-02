## Context

`@hongyishi/ui` 共享组件库已初始化，包含 Button、Card、Form、Layout 组件。目前组件开发依赖 pharmacy app 运行，无法独立预览和测试。缺乏组件文档和视觉回归测试。

## Goals / Non-Goals

**Goals:**
- Storybook 8 在 `packages/ui` 中独立运行
- 为所有组件编写 Stories（Button、Card、Form、Layout）
- 配置 Chromatic 进行视觉回归测试
- Storybook CI 集成到 GitHub Actions

**Non-Goals:**
- 不迁移 pharmacy 现有组件到 Storybook（pharmacy 自身不使用 Storybook）
- 不搭建完整的组件文档站（只做开发预览）
- 不配置 Controls 自动化测试（手动测试即可）

## Decisions

### 1. Storybook 8 + Vite builder
使用 `@storybook/react-vite` 而非 webpack builder。理由：`packages/ui` 使用 TypeScript + Vite，与 Vite builder 原生集成，无需额外配置。

### 2. Stories 放在 `packages/ui/stories/`
不放在组件同目录（`src/components/*/`），因为 Storybook 文件不是生产代码。`stories/` 作为独立目录更清晰。

### 3. Chromatic 替代手动截图
视觉回归测试用 Chromatic（@chromatic-como/test），每次 PR 自动对比截图。虽然是付费服务，但有免费额度，且比自建截图对比方案更可靠。

### 4. 不引入额外主题配置
直接使用 Storybook 默认主题 + 少量 brand color 定制，减少维护成本。

## Risks / Trade-offs

- **风险**: Storybook 运行时依赖 `tailwindcss` CSS 变量，但 `packages/ui` 本身不包含 Tailwind 配置  
  **缓解**: 消费 app 提供 CSS 变量，或在 ui 包内添加基础 CSS 变量文件
- **风险**: Chromatic 免费额度用尽后需付费  
  **缓解**: 先用免费额度，视觉测试不是 blocker，可后续按需启用
- **Trade-off**: Stories 维护成本 — 组件变更需同步更新 Stories  
  **缓解**: Stories 采用简洁的 CSF3 格式，与组件代码同步维护

## Migration Plan

1. 安装 `@storybook/react-vite` 及相关依赖
2. 创建 `.storybook/main.ts` 和 `preview.ts`
3. 编写组件 Stories
4. 添加 `storybook` 和 `build-storybook` scripts 到 `packages/ui/package.json`
5. 推送后 Storybook CI 自动运行
6. （可选）配置 Chromatic project token 启用视觉测试

## Open Questions

1. `packages/ui` 组件依赖 Tailwind CSS 变量（`text-foreground`、`bg-primary` 等），Storybook 运行时如何提供？
   - 方案A: 在 `.storybook/preview.ts` 中引入 pharmacy 的 CSS
   - 方案B: 在 ui 包内创建 `src/styles/variables.css`
2. 是否需要 Storybook 部署到公开 URL？
