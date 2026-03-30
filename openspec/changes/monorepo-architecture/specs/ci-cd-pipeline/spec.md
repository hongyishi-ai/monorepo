# CI/CD Pipeline

本规范定义了红医师 Monorepo 的持续集成和持续部署流程，基于 Turborepo 任务图和 GitHub Actions 实现跨应用的自动化构建、测试和部署。

## ADDED Requirements

### Requirement: Continuous Integration Workflow

CI workflow SHALL trigger on every PR and push to validate code quality and build correctness。

#### Scenario: PR Triggers Full CI Suite

- GIVEN 开发者提交 PR 到 `hongyishi-monorepo` 的 main 分支
- WHEN GitHub Actions 检测到 `pull_request` 事件
- THEN CI workflow 启动，并行运行所有受影响 apps 的检查
- AND 每个 app 执行 `pnpm install` → `pnpm lint` → `pnpm type-check` → `pnpm build`
- AND 所有检查必须通过，PR 才能合并

#### Scenario: Parallel App Build via Turborepo

- GIVEN PR 修改了 `apps/pharmacy/` 和 `apps/clinic/`
- WHEN CI 中执行 `pnpm build`
- THEN Turborepo 根据 `turbo.json` 依赖图并行构建这两个 apps
- AND `apps/fms/` 和 `apps/portal/` 因无变更而不被执行（增量构建）

#### Scenario: Type Check as Gate

- GIVEN 开发者提交了带 TypeScript 类型错误的代码
- WHEN CI 中 `pnpm type-check` 任务执行
- THEN TypeScript 编译器报错，job 失败
- AND PR 状态显示失败，阻止合并

#### Scenario: Lint Check as Gate

- GIVEN 开发者提交的代码违反 ESLint 规则（如未使用的变量）
- WHEN CI 中 `pnpm lint` 任务执行
- THEN ESLint 报告错误，job 失败
- AND 开发者必须在本地修复后才能通过 CI

---

### Requirement: Deployment Workflow

Deploy workflow SHALL deploy affected apps only when `apps/*/` directories have changes。

#### Scenario: Pharmacy Change Triggers Pharmacy Deploy

- GIVEN 开发者合并了一个修改 `apps/pharmacy/` 的 PR
- WHEN GitHub Actions 检测到 `push` 到 main 且 `apps/pharmacy/` 有变更
- THEN 仅 `pharmacy#build` 任务执行
- AND 部署 job 将 pharmacy 构建产物推送到 `PHARMACY_URL` 环境变量指定的服务器

#### Scenario: Shared Package Change Triggers Dependent Apps Rebuild

- GIVEN 开发者修改了 `packages/ui/src/components/Button.tsx`
- WHEN 部署 workflow 运行时
- THEN Turborepo 自动识别所有依赖 `packages/ui` 的 apps（pharmacy、clinic、fms）
- AND 这些 apps 自动触发 rebuild
- AND 部署流程传播变更到所有受影响应用

#### Scenario: No App Change Skips Deploy

- GIVEN 开发者仅修改了 `README.md` 或 `.github/workflows/`
- WHEN push 到 main 分支
- THEN CI 仍然运行（lint/type-check 仍需验证）
- AND 部署 workflow 跳过（`apps/*/` 无变更）

---

### Requirement: Environment Variables and Secrets

CI/CD pipeline SHALL be configured via GitHub Secrets for deployment-related environment variables。

必需的 Secrets：
- `DEPLOY_TOKEN` — 部署服务器 SSH 密钥
- `HEAT_STROKE_URL` — 热射病平台部署地址
- `PHARMACY_URL` — 移动药房部署地址
- `CLINIC_URL` — 门诊系统部署地址
- `FMS_URL` — 训练伤平台部署地址
- `PORTAL_URL` — 门户主站部署地址

#### Scenario: Deploy Token Authentication

- GIVEN CI 需要 SSH 到部署服务器
- WHEN GitHub Actions job 执行部署步骤
- THEN 使用 `DEPLOY_TOKEN` secret 进行 SSH 认证
- AND 将构建产物通过 scp 或 rsync 推送到目标服务器

#### Scenario: App-Specific Deploy URL

- GIVEN pharmacy 构建完成需要部署
- WHEN 部署 job 读取 `PHARMACY_URL` 环境变量
- THEN 构建产物被推送到对应的子域名或服务器路径
- AND 不影响其他 apps 的部署目标

---

### Requirement: Build Output Management

各 app 的构建产物 SHALL be correctly mapped via Turborepo `outputs` configuration。

#### Scenario: Vite App Build Output

- GIVEN pharmacy 执行 `pnpm --filter @hongyishi/pharmacy build`
- WHEN Vite 构建完成
- THEN 输出到 `apps/pharmacy/dist/`
- AND `turbo.json` 中 `pharmacy#build` 的 `outputs` 正确配置为 `["dist/**"]`

#### Scenario: Next.js App Build Output

- GIVEN portal 执行 `pnpm --filter @hongyishi/portal build`
- WHEN Next.js 构建完成
- THEN 输出到 `apps/portal/.next/`
- AND `turbo.json` 中 `portal#build` 的 `outputs` 正确配置为 `[".next/**", "!build/**"]`

#### Scenario: FMS Build Output

- GIVEN fms 执行 `pnpm --filter @hongyishi/fms build`
- WHEN Vite 构建完成
- THEN 输出到 `apps/fms/fms-app/dist/`
- AND `turbo.json` 中 `fms#build` 的 `outputs` 正确配置为 `["fms-app/dist/**"]`

---

### Requirement: React Version Enforcement SHALL Block Inconsistent PRs

CI SHALL include a `check-react-versions` step that detects React version drift across apps.

#### Scenario: React Version Check on Every CI Run

- GIVEN CI 执行任意 PR 或 push 检查
- WHEN `check-react-versions` 步骤运行
- THEN 脚本读取所有 `apps/*/package.json` 中的 `react` 版本
- AND 如果存在版本不一致（如 pharmacy=18.2.0 vs fms=^19.2.4），job 失败
- AND 失败报告列出不一致的 app 名称和版本

#### Scenario: React Version Drift Detected Before Merge

- GIVEN 开发者提交了仅修改 `apps/pharmacy/` 的 PR，但未更新 React 版本
- WHEN CI 中 `check-react-versions` 检测到 pharmacy 使用 `18.2.0` 而其他 apps 使用 `^19.2.4`
- THEN CI job 报告错误：`pharmacy uses react@18.2.0, expected ^19.2.4`
- AND PR 被阻止合并

#### Scenario: React Upgrade PR Passes CI

- GIVEN 开发者提交了升级 pharmacy React 版本的 PR（18.2.0 → ^19.2.4）
- WHEN CI 执行 `check-react-versions`
- THEN 检测到所有 apps 版本一致（均为 `^19.2.4`）
- AND `check-react-versions` 步骤通过，CI 继续执行后续 lint/build 步骤

#### Scenario: New App React Version Gate

- GIVEN 新 app 被添加到 `apps/`
- WHEN `check-react-versions` 执行时
- THEN 新 app 的 React 版本必须与其他 apps 一致（`^19.2.4`）
- AND 如果新 app 声明了其他 React 版本，CI 失败

---

### Requirement: Monorepo Task Coordination

Turborepo SHALL respect dependency graph via `dependsOn: ["^build"]` to ensure apps build after their dependencies。

#### Scenario: Dependency Build Ordering

- GIVEN `apps/pharmacy` 依赖 `@hongyishi/ui`
- WHEN 执行 `pnpm --filter @hongyishi/pharmacy build`
- THEN Turborepo 先检测 `^build`（上游依赖），先构建 `packages/ui`
- AND pharmacy 的构建在后，引用 `packages/ui/dist/`
- AND 不会出现 "cannot find module" 错误

#### Scenario: Shared Config Package in Build Graph

- GIVEN `packages/config` 不产出构建产物（仅配置）
- WHEN 其他 apps 执行 build 时引用了 `@hongyishi/config`
- THEN `config` 的 `build` task 仅执行 `tsc --noEmit`（type-check）
- AND 不生成 dist，依赖它的 apps 仍然正常构建
