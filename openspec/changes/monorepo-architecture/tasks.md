# Monorepo 架构搭建 — 任务清单

## Phase 1: 基础框架搭建

### 1.1 项目初始化

- [x] 创建 `package.json`（根目录，workspace 配置）
- [x] 创建 `pnpm-workspace.yaml`
- [x] 创建 `turbo.json`
- [x] 创建 `tsconfig.base.json`
- [x] 初始化 `.gitignore`
- [x] 运行 `pnpm install` 验证

### 1.2 共享包骨架

- [x] 创建 `packages/ui/` 目录结构
- [x] 创建 `packages/ui/package.json`
- [x] 创建 `packages/utils/` 目录结构
- [x] 创建 `packages/utils/package.json`
- [x] 创建 `packages/config/` 目录结构
- [x] 创建 `packages/config/package.json`
- [x] 运行 `pnpm install` 验证所有包解析

### 1.3 UI 组件库初始化

- [x] 创建 `packages/ui/src/index.ts`（导出入口）
- [ ] 创建基础 Button 组件
- [ ] 创建基础 Card 组件
- [ ] 创建基础 Form 组件（Input、Select）
- [ ] 创建 Layout 组件（Container、Stack）
- [ ] 配置 Storybook
- [ ] 验证 `pnpm --filter @hongyishi/ui build` 正常

### 1.4 工具库初始化

- [x] 创建 `packages/utils/src/index.ts`（导出入口）
- [ ] 实现 formatDate、formatNumber、formatFileSize
- [ ] 实现 validatePhone、validateEmail
- [ ] 实现 createApiClient
- [ ] 编写单元测试（Vitest）
- [ ] 验证 `pnpm --filter @hongyishi/utils test` 正常

### 1.5 配置包初始化

- [x] 创建 `packages/config/eslint/` 配置
- [x] 创建 `packages/config/prettier/` 配置
- [x] 创建 `packages/config/typescript/` 配置
- [x] 创建 `packages/config/tailwind/` 配置
- [x] 验证各 app 可正常继承配置

### 1.6 GitHub Actions CI/CD

- [x] 创建 `.github/workflows/ci.yml`
- [ ] 创建 `.github/workflows/deploy.yml`
- [x] 配置各 app 的过滤构建
- [ ] 配置部署到子域名的触发条件
- [x] 验证 CI 配置语法正确

## Phase 2: 子项目迁入准备

### 2.1 pharmacy 迁移

- [x] 在 `apps/` 下创建 `pharmacy/`
- [x] 复制 `pharmacy` 仓库代码
- [x] 替换依赖为 workspace 引用
- [x] 修复构建错误（移除 `files: []`，tsconfig.json 只保留 `extends` 和 `references`；build 脚本改为 `vite build`）
- [x] 验证 `pnpm --filter pharmacy build` 成功

### 2.2 clinic 迁移

- [x] 在 `apps/` 下创建 `clinic/`
- [x] 复制 `care-symptom-assistant` 仓库代码
- [x] 替换依赖为 workspace 引用
- [x] 修复构建错误
- [x] 验证 `pnpm --filter clinic build` 成功

### 2.3 heat-stroke 迁移

- [x] 在 `apps/` 下创建 `heat-stroke/`
- [x] 复制 `hongyishi-HS` 仓库代码
- [x] 替换依赖为 workspace 引用
- [x] 修复构建错误（无 — 纯静态 PWA，无需 build）
- [x] 验证 `pnpm --filter heat-stroke build` 成功（无 build 脚本，`serve` 直接托管静态文件）

### 2.4 fms 迁移

- [x] 在 `apps/` 下创建 `fms/`
- [x] 复制 `FMS2-Private` 仓库代码
- [x] 替换依赖为 workspace 引用
- [x] 修复构建错误
- [x] 验证 `pnpm --filter fms build` 成功

### 2.5 portal 迁移

- [x] 在 `apps/` 下创建 `portal/`
- [x] 复制 `blog-starter-kit` 仓库代码
- [x] 替换依赖为 workspace 引用
- [x] 修复构建错误
- [x] 验证 `pnpm --filter portal build` 成功

## Phase 3: 生产验证

### 3.1 全量构建验证

- [ ] 运行 `pnpm build` 验证所有 app 正常构建
- [ ] 验证 Turborepo 增量构建正确
- [ ] 验证构建产物部署到测试环境

### 3.2 文档与交接

- [ ] 更新 README.md（含快速开始指南）
- [ ] 归档 OpenSpec change
- [ ] 创建 GitHub 仓库，推送初始代码

---

## 待修复问题

1. ~~**pharmacy tsconfig** — `files: []` 与 `extends` 不能共存~~ ✅ 已修复
2. ~~**heat-stroke build** — 需单独验证构建状态~~ ✅ 已验证（纯静态 PWA）
3. **缺少 deploy workflow** — `deploy.yml` 还未创建
4. **pharmacy type-check** — `tsc --noEmit` 仍有 composite/noEmit 冲突，build 已改为直接用 vite
