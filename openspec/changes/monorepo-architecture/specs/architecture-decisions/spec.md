# Architecture Decisions

本文件记录红医师 Monorepo 的关键架构决策（Architecture Decision Records）。

## ADDED Requirements

### Requirement: React Version MUST Be Unified Across All Apps

当前各 app 的 React 版本存在严重不一致，必须统一。The ADR MUST document the target version, migration path, and enforcement mechanism.

现状（基于 package.json 分析）：

| App | React 版本 | 备注 |
|---|---|---|
| pharmacy | `18.2.0` | React 18 稳定版 |
| clinic | `^18.2.0` | React 18 |
| fms | `^19.1.0` | React 19 |
| portal | `19.0.0-rc-...` | React 19 RC（Next.js 15 项目） |
| heat-stroke | 无 dependency | 使用原生 JS，无 React |

#### Scenario: Detecting Version Drift

- GIVEN CI 执行依赖审计
- WHEN `pnpm list --depth 0 --recursive` 显示各 app 实际安装的 React 版本
- THEN 发现 pharmacy/clinic 使用 18.x，而 fms/portal 使用 19.x
- AND 不同 React 版本意味着运行时行为可能不一致

#### Scenario: Shared Package Version Constraint

- GIVEN `@hongyishi/ui` 的 `peerDependencies` 声明 `react: ^18.0.0`
- WHEN `packages/ui` 使用了 React 19 的 API（如 `use()` hook、Document Metadata）
- THEN 安装在 React 18 apps 中会产生运行时错误
- AND `packages/ui` 必须等到 React 版本统一后才能安全地使用 React 19 新特性

---

### Requirement: Target React Version SHALL Be React 18.3

目标版本 MUST be `react: ^18.3.0` and `react-dom: ^18.3.0`，理由如下：

1. **React 18.3 是当前最新稳定版本**，pharmacy 和 clinic 已在用 18.x，升级成本最低
2. **React 19 breaking changes 较多**：Portal ref、Context as provider、Server Components 等变化需要大量迁移工作
3. **Next.js 15 完全支持 React 18**，portal 的 Next.js 项目可以用 React 18
4. **各 app 均需修改**：fms 和 portal 需要降级

统一目标：

| App | 当前版本 | 目标版本 |
|---|---|---|
| pharmacy | `18.2.0` | `^18.3.0` |
| clinic | `^18.2.0` | `^18.3.0` |
| fms | `^19.1.0` | `^18.3.0` |
| portal | `19.0.0-rc-...` | `^18.3.0` |
| heat-stroke | 无 dependency | 无需变更 |

#### Scenario: Upgrading pharmacy and clinic to React 18.3

- GIVEN pharmacy 当前使用 `react: 18.2.0`，clinic 使用 `react: ^18.2.0`
- WHEN 执行 `pnpm up react@^18.3.0 react-dom@^18.3.0`
- THEN 仅 patch 版本升级，无破坏性变更风险
- AND `@radix-ui/*` 组件均已支持 React 18

#### Scenario: Downgrading fms from React 19 to React 18.3

- GIVEN fms 当前使用 `react: ^19.1.0`
- WHEN 执行 `pnpm up react@^18.3.0 react-dom@^18.3.0`
- THEN 需确认 Vite 和 `vite-plugin-react` 版本支持 React 18
- AND IndexedDB 相关代码无需变更（React 版本无关）
- AND 测试套件中 `react-test-renderer` 需更新版本

#### Scenario: Downgrading portal from React 19 RC to React 18.3 Stable

- GIVEN portal 当前使用 `react: 19.0.0-rc-02c0e824-20241028`
- WHEN 升级到 `react: ^18.3.0`
- THEN Next.js 15 完全支持 React 18
- AND 现有的 React 19 RC 特定 workaround 需移除
- AND Server Components 行为与 React 18 一致

---

### Requirement: React Version Enforcement in CI

任何 PR 不得引入不同 React 版本。CI MUST enforce this constraint.

#### Scenario: CI Blocks Version Drift

- GIVEN 开发者提交 PR，将 pharmacy 的 `react` 改为 `19.0.0`
- WHEN GitHub Actions 执行 `pnpm dedupe --check` 或依赖审计
- THEN CI 失败并提示 React 版本不一致
- AND PR 必须修复后才能合并

#### Scenario: Enforcing via @rushstack/ensure-react-versions

- GIVEN monorepo 配置了 `pnpm.checkReactVersions` 检查脚本
- WHEN `pnpm install` 或 CI 运行
- THEN 如果存在 React 版本不一致，构建失败
- AND 错误信息指明哪些 app 的 React 版本需要统一
