## Why

红医师现有的5个子项目（门户主站、热射病防治平台、门诊辅助诊断、移动药房、训练伤防治平台）分散在独立仓库中，技术栈不统一（TypeScript/JavaScript/HTML）、缺乏共享代码库、工具链分散，每次维护都要在多个仓库间切换，导致开发效率低、代码复用困难、部署流程不统一。

通过建立统一的 Monorepo 架构，整合共享工具链、组件库和部署流程，为未来5个项目合并到统一代码库奠定基础。

## What Changes

- 创建 `hongyishi-monorepo` 作为红医师的统一代码仓库
- 建立 `packages/` 共享包结构（`@hongyishi/ui`、`@hongyishi/utils`、`@hongyishi/config`）
- 统一技术栈为 TypeScript + React（渐进式迁移）
- 建立统一的 ESLint、Prettier、TypeScript 配置
- 建立统一的 CI/CD 部署流程
- 保留各子项目独立部署能力，不影响现有线上服务

## Capabilities

### New Capabilities
- `monorepo-structure`: 定义 monorepo 目录结构、共享包规范、构建工具选择（PNPM workspaces）
- `shared-ui-components`: 共享 UI 组件库，统一设计语言和交互组件
- `shared-utils`: 共享工具库（格式化、验证、API 封装等）
- `shared-config`: 统一 ESLint/Prettier/TypeScript/TSConfig 配置
- `ci-cd-pipeline`: 统一的 GitHub Actions 部署流水线
- `migration-playbook`: 各子项目迁入 monorepo 的操作手册

### Modified Capabilities
- （无——这是新建项目，暂无现有系统需要修改）

## Impact

- 新建代码库：`hongyishi-monorepo`
- 影响的子项目：blog-starter-kit、hongyishi-HS、pharmacy、care-symptom-assistant、FMS2-Private
- 依赖工具：PNPM（包管理）、Turborepo 或 NX（构建协调）、GitHub Actions（CI/CD）
- 风险：迁移过程中需保证各子项目可独立部署，不影响现有线上服务
