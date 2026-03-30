# Monorepo Structure

本规范定义了红医师 Monorepo 的目录结构、workspace 配置、Turborepo 构建编排以及各应用的 TypeScript 基础配置。

## ADDED Requirements

### Requirement: PNPM Workspace Structure

红医师 Monorepo SHALL 采用 PNPM workspaces 管理，目录分为 `apps/`（5 个应用）和 `packages/`（3 个共享包）。

- **apps/portal** — 红医师门户主站，基于 Next.js（`name: @hongyishi/portal`）
- **apps/heat-stroke** — 热射病防治平台，基于 Vite + React（`name: @hongyishi/heat-stroke`）
- **apps/pharmacy** — 移动药房，基于 Vite + React + Radix UI（`name: @hongyishi/pharmacy`）
- **apps/clinic** — 门诊辅助诊断，基于 Vite + React + Radix UI（`name: @hongyishi/clinic`）
- **apps/fms** — 训练伤防治平台，基于 Vite + React + Radix UI（`name: @hongyishi/fms`）
- **packages/ui** — 共享 UI 组件库（`@hongyishi/ui`）
- **packages/utils** — 共享工具函数库（`@hongyishi/utils`）
- **packages/config** — 统一 ESLint/Prettier/Tailwind/TypeScript 配置（`@hongyishi/config`）

#### Scenario: PNPM Workspace Initialization

- GIVEN 开发者克隆 Monorepo 仓库后处于根目录
- WHEN 执行 `pnpm install`
- THEN 所有 `apps/*` 和 `packages/*` 的依赖被正确安装，依赖提升到根目录
- AND `node_modules` 仅存在于根目录，各子目录无冗余副本

#### Scenario: Building a Single App via Filter

- GIVEN 需要构建 pharmacy 应用
- WHEN 执行 `pnpm --filter @hongyishi/pharmacy build`
- THEN Turborepo 仅构建 pharmacy 及其依赖的 packages
- AND 其他 apps（如 clinic、fms）不会被触发构建

#### Scenario: Building All Apps

- GIVEN 多个 apps 存在依赖关系（如 portal 依赖 @hongyishi/ui）
- WHEN 执行 `pnpm -r build` 或通过 Turborepo 执行 `pnpm build`
- THEN Turborepo 根据依赖图拓扑排序，先构建 packages，再并行构建 apps

#### Scenario: Cross-Package Import Resolution

- GIVEN apps/pharmacy 需要使用共享组件和工具
- WHEN 代码中写入 `import { Button } from '@hongyishi/ui'` 和 `import { formatDate } from '@hongyishi/utils'`
- THEN TypeScript 和 PNPM 正确解析到 `packages/ui` 和 `packages/utils`
- AND 构建产物中不出现模块解析错误

---

### Requirement: Turborepo Build Configuration

`turbo.json` SHALL 定义全量任务的构建管道，各 app 有独立的 build/dev/lint/test/type-check 任务。

#### Scenario: Dev Server with Cache Disabled

- GIVEN 开发者在 clinic 目录下执行 `pnpm --filter @hongyishi/clinic dev`
- WHEN Turborepo 识别到 `clinic#dev` 任务 `cache: false, persistent: true`
- THEN 本地启动 Vite dev server，不读写 Turborepo 缓存
- AND 其他 apps 的 dev server 互不影响

#### Scenario: Incremental Build via Cache

- GIVEN pharmacy 已完成一次构建，Turborepo 缓存已生成
- WHEN 仅修改了 `packages/ui/src/` 中的一个组件文件后执行 build
- THEN Turborepo 命中 `^build`（依赖包的构建），跳过未受影响的 apps
- AND pharmacy 的 dist 被正确重新生成

---

### Requirement: TypeScript Base Configuration

`tsconfig.base.json` SHALL 定义所有包和应用的 TypeScript 基础配置，包含 strict 模式、ES2022 目标、React JSX 支持。

#### Scenario: App Inherits Base TypeScript Config

- GIVEN `apps/clinic/tsconfig.json` 存在并引用 `"extends": "@hongyishi/config/typescript"`
- WHEN 开发者在 clinic 中编写 TypeScript 代码
- THEN `strict: true`、`noUnusedLocals`、`noUnusedParameters` 等规则自动生效
- AND `skipLibCheck: true` 跳过 node_modules 类型检查以提升速度

#### Scenario: Type Error in Shared Package

- GIVEN 开发者在 `packages/utils/src/format/` 中添加了新函数但遗漏了类型声明
- WHEN 该 app 的 CI 执行 `pnpm --filter @hongyishi/fms type-check`
- THEN TypeScript 编译器报告类型错误，构建失败
- AND 开发者必须修复 packages 中的类型问题才能通过 CI

---

### Requirement: App Technology Stack Declaration

各 app 的技术栈 MUST 与实际 package.json 保持一致，包括 React 版本。

#### Scenario: Technology Stack Verification

- GIVEN 需要确认各 app 的 React 版本
- WHEN 分析 `apps/*/package.json` 中的 dependencies
- THEN 发现当前版本严重不一致：pharmacy 为 `18.2.0`，clinic 为 `^18.2.0`，fms 为 `^19.1.0`，portal 为 `19.0.0-rc-02c0e824-20241028`（RC）
- AND 这些版本不一致是架构问题，需要通过 React 版本统一决策（参见 architecture-decisions/spec.md）解决

#### Scenario: React Version Unified (Target State)

- GIVEN 所有 apps 最终统一到 React 19 stable
- WHEN 各 app 的 `package.json` 中 `react` 版本一致
- THEN `@hongyishi/ui` 的 `peerDependencies` 可安全声明 `react: ^19.0.0`
- AND CI 可通过 `pnpm checkReactVersions` 检测版本漂移
