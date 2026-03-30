# Migration Playbook

本规范记录了红医师各子项目从独立仓库迁移到 Monorepo 的操作手册，包括已完成阶段和后续迁移计划。

## ADDED Requirements

### Requirement: Migration Process Overview

各子项目从独立 Git 仓库迁移到 Monorepo SHALL follow four stages。

#### Scenario: Migration of pharmacy (Completed)

- GIVEN pharmacy 原项目在独立 Git 仓库 `pharmacy/`
- WHEN 按照 Migration Stages 完成迁移
- THEN pharmacy 作为 `apps/pharmacy/` 存在于 Monorepo
- AND `package.json` 中依赖改为 workspace 引用（如 `@hongyishi/ui: workspace:*`）
- AND `pnpm --filter @hongyishi/pharmacy build` 正常执行
- AND 原仓库已标记为 archived（read-only）

#### Scenario: Migration of clinic (Completed)

- GIVEN clinic 原项目 `care-symptom-assistant/` 有独立 Git 仓库
- WHEN 迁移完成后，clinic 作为 `apps/clinic/` 运行在 Monorepo
- THEN `package.json` 中 `@radix-ui/*` 依赖通过 workspace 引用 `@hongyishi/ui`（如已迁移）
- AND 所有源码位于 `apps/clinic/src/`

#### Scenario: Migration of fms (Completed)

- GIVEN fms 原项目 `FMS2-Private/` 有独立 Git 仓库
- WHEN 迁移完成后，fms 作为 `apps/fms/` 运行在 Monorepo
- THEN 构建产物输出到 `apps/fms/fms-app/dist/`
- AND Turborepo 配置中 `fms#build` 输出正确映射

---

### Requirement: Workspace Dependency Migration

迁移过程中，各 app 的外部依赖 SHALL be replaced with workspace references。

#### Scenario: Replacing External UI Lib with Shared Package

- GIVEN pharmacy 原通过 npm 安装 radix-ui 组件各自使用
- WHEN `@hongyishi/ui` 中已包含共享的 Radix UI 封装组件
- THEN pharmacy 的 `package.json` 中删除独立 `@radix-ui/react-dialog` 等条目
- AND 代码中改为 `import { Dialog } from '@hongyishi/ui'`
- AND `pnpm install` 解析为 `packages/ui` 的本地路径

#### Scenario: Replacing Local Utils with Shared Package

- GIVEN clinic 原 `src/utils/format.ts` 包含日期格式化逻辑
- WHEN `packages/utils/src/format/` 中已添加相同功能
- THEN clinic 代码中 `import { formatDate } from '../../utils/format'` 改为 `import { formatDate } from '@hongyishi/utils'`
- AND 原本地 utils 文件删除或降级为 app-specific 使用

---

### Requirement: Post-Migration Verification

迁移完成后 MUST pass all quality gates。

#### Scenario: Build Verification

- GIVEN 所有 app 迁移到 Monorepo 完成
- WHEN 执行 `pnpm -r build`（全量构建）
- THEN 每个 app 的构建任务按拓扑顺序执行，无报错
- AND 所有 `dist/` 和 `.next/` 输出正确生成

#### Scenario: Type Check Verification

- GIVEN 完成迁移后执行 `pnpm --filter @hongyishi/fms type-check`
- WHEN TypeScript 编译器运行
- THEN 无类型错误报告
- AND 所有从 `@hongyishi/utils` 和 `@hongyishi/ui` 导入的类型正确解析

#### Scenario: Dev Server Verification

- GIVEN 开发者启动 clinic 的本地开发服务器
- WHEN 执行 `pnpm --filter @hongyishi/clinic dev`
- THEN Vite dev server 在正确端口启动（通常是 3000+）
- AND HMR（热模块替换）正常工作，代码修改即时生效

---

### Requirement: Remaining Migration Tasks

以下迁移任务 SHALL be tracked and prioritized。

#### Scenario: heat-stroke Utils Migration

- GIVEN `apps/heat-stroke/src/utils/` 存在本地工具函数
- WHEN 识别出哪些是通用工具（format、validation）和哪些是 app-specific
- THEN 通用工具迁移到 `packages/utils/`
- AND app-specific 工具保留在 `apps/heat-stroke/src/utils/`

#### Scenario: heat-stroke UI Library Decision

- GIVEN heat-stroke 当前无 UI 库依赖
- WHEN 该应用需要共享 Button、Card 等基础组件
- THEN `@hongyishi/ui` 应提供不依赖 Radix UI 的纯 CSS/HTML 组件版本
- AND heat-stroke 可以引入共享组件而不引入 Radix 依赖

#### Scenario: portal Dependency on Shared Packages

- GIVEN portal（Next.js）目前不依赖 `@hongyishi/ui` 或 `@hongyishi/utils`
- WHEN portal 需要使用共享组件或工具函数时
- THEN 应通过 workspace 引用 `@hongyishi/ui` 和 `@hongyishi/utils`
- AND 在 `apps/portal/tsconfig.json` 中确保路径别名正确解析

---

### Requirement: Original Repository Archival

迁移完成后，原独立仓库 SHALL be archived as read-only。

#### Scenario: Archiving Original Repositories

- GIVEN pharmacy 迁移完成并验证通过
- WHEN 在原 `pharmacy` GitHub 仓库设置中启用 "Archive this repository"
- THEN 仓库显示 "Archived" 状态，无法推送新提交
- AND README 中注明迁移到 Monorepo 的信息

#### Scenario: History Preservation

- GIVEN 需要保留原仓库的完整 Git 历史
- WHEN 迁移过程中使用 `git subtree add` 或 `git filter-repo`
- THEN Monorepo 中的 `apps/pharmacy/` 包含完整的提交历史
- AND 不丢失任何原有的代码演进记录
