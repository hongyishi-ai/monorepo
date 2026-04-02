# 红医师 monorepo

整合红医师旗下多个医疗相关平台的统一代码仓库。

[![CI](https://github.com/hongyishi-ai/monorepo/actions/workflows/ci.yml/badge.svg)](https://github.com/hongyishi-ai/monorepo/actions)

## 项目结构

```
hongyishi-monorepo/
├── apps/
│   ├── portal/        # 红医师门户（Next.js 15 + React 18）
│   ├── pharmacy/      # 移动药房系统（Vite + React 18）
│   ├── clinic/        # 门诊辅助诊断（Vite + React 18）
│   ├── fms/           # 训练伤防治平台（Vite + PWA + React 18）
│   └── heat-stroke/   # 热射病防治平台（静态 PWA）
├── packages/
│   ├── ui/            # 共享 UI 组件库
│   ├── utils/         # 共享工具库（含 format/validation/api）
│   └── config/        # 统一配置（ESLint / Prettier / TypeScript / Tailwind）
├── .github/workflows/
│   ├── ci.yml        # CI：React 版本检测 + 构建 + 类型检查
│   └── deploy.yml     # 部署到 GitHub Pages
└── openspec/         # OpenSpec 变更管理
```

## 技术栈

| 类别 | 技术 |
|------|------|
| 包管理 | PNPM 10 |
| 构建协调 | Turborepo 2 |
| 语言 | TypeScript 5（严格模式） |
| UI 框架 | React 18.3.0 |
| SSR 框架 | Next.js 15（portal） |
| 构建工具 | Vite 5/6 |
| 代码规范 | ESLint 9 + Prettier 3 |
| 单元测试 | Vitest 2 |

## 快速开始

```bash
# 安装依赖
pnpm install

# 开发所有项目
pnpm dev

# 构建所有项目
pnpm build

# 类型检查
pnpm type-check

# 运行所有测试
pnpm test

# 开发单个项目
pnpm --filter pharmacy dev
pnpm --filter clinic dev
pnpm --filter portal dev
pnpm --filter fms dev
```

## 应用端口

| App | 端口 | 访问 |
|-----|------|------|
| pharmacy | 5173 | http://localhost:5173 |
| clinic | 3001 | http://localhost:3001 |
| portal | 3000 | http://localhost:3000 |
| fms | 5174 | http://localhost:5174 |
| heat-stroke | 3000 | `npx serve apps/heat-stroke -l 3000` |

## CI/CD

- **CI**: 每次 push 到 main 和 PR 自动运行，包含 React 版本一致性检测
- **React 版本策略**: 所有 app 统一使用 `react@^18.3.0`，CI 确保不会有新版本混入
