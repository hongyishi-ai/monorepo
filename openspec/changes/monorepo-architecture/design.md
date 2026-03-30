# Monorepo 架构设计

## 1. 技术选型

### 包管理器：PNPM
- **原因**：性能最优、磁盘占用最低、支持 workspaces 原生
- **替代品**：NPM（慢）、Yarn（兼容性好但不如 PNPM 快）

### 构建协调：Turborepo
- **原因**：轻量、与 PNPM 集成好、增量构建、开箱即用
- **替代品**：NX（功能更全但配置复杂）

### 语言：TypeScript（严格模式）
- 渐进式迁移：现有 JS 项目逐步添加 TS
- 共享包必须使用 TS

### 框架：React
- 统一前端框架为 React
- 现有 HTML/原生 JS 项目逐步迁移

## 2. 目录结构

```
hongyishi-monorepo/
├── apps/                      # 应用层
│   ├── portal/                # 门户主站（Next.js）
│   ├── heat-stroke/          # 热射病平台（React）
│   ├── pharmacy/             # 移动药房（React）
│   ├── clinic/               # 门诊辅助（React）
│   └── fms/                 # 训练伤平台（React）
├── packages/                  # 共享包
│   ├── ui/                  # @hongyishi/ui
│   │   ├── src/
│   │   │   ├── components/  # 组件
│   │   │   ├── styles/      # 样式
│   │   │   └── index.ts     # 导出
│   │   └── package.json
│   ├── utils/               # @hongyishi/utils
│   │   ├── src/
│   │   │   ├── format/
│   │   │   ├── validation/
│   │   │   ├── api/
│   │   │   └── index.ts
│   │   └── package.json
│   └── config/              # @hongyishi/config
│       ├── eslint/
│       ├── prettier/
│       ├── typescript/
│       └── tailwind/
├── .github/
│   └── workflows/           # CI/CD
├── openspec/                 # OpenSpec
├── package.json              # workspace 根配置
├── pnpm-workspace.yaml       # PNPM workspaces 定义
├── turbo.json               # Turborepo 配置
└── tsconfig.base.json       # 基础 TS 配置
```

## 3. 共享包设计

### @hongyishi/ui
- 使用 CSS Modules + TailwindCSS
- Storybook 文档化
- 发布到 npm registry

### @hongyishi/utils
- 纯 TypeScript，无 UI 依赖
- 单元测试覆盖率 > 80%
- 树下游共享

### @hongyishi/config
- 只读配置包
- 包含 ESLint、Prettier、TS、Tailwind 配置
- 应用通过 `extends` 引用

## 4. 部署架构

### 现状（保持不变）
- 各子项目独立部署到各自子域名
- 使用 PM2 或 Docker 容器

### Monorepo 中的部署
- CI 构建产物到 `dist/`
- 部署脚本通过 `rsync` 或 Docker 同步到服务器
- 各 app 的部署独立，不互相影响

## 5. 依赖管理策略

### Workspace 引用
```json
// apps/portal/package.json
{
  "dependencies": {
    "@hongyishi/ui": "workspace:*",
    "@hongyishi/utils": "workspace:*"
  }
}
```

### 版本策略
- 所有包使用 `workspace:*` 协议
- 发布时使用 `pnpm publish`
- 遵循 semver

## 6. 迁移策略

### Phase 1：框架搭建（当前阶段）
- 初始化 monorepo 结构
- 建立共享包骨架
- 完成 CI/CD 基础流程

### Phase 2：子项目迁入
- 按依赖顺序逐步迁入
- 每个项目作为独立 change 管理

### Phase 3：完全合并
- 所有子项目统一到 monorepo
- 原仓库归档

## 7. 风险与缓解

| 风险 | 缓解 |
|------|------|
| 迁移过程影响线上服务 | 新旧并行运行，逐步切换 |
| 构建时间增加 | Turborepo 增量构建 |
| 依赖冲突 | 统一依赖版本，workspace 约束 |
| 单点故障 | CI 分 app 独立运行 |
