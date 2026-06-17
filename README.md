# 红医师 monorepo

整合红医师旗下多个医疗相关平台的统一代码仓库。当前优先将门户、训练伤防治、热射病防治整合为单一入口平台。

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
├── functions/
│   └── api/           # Cloudflare Pages Functions
├── scripts/
│   └── build-cloudflare.mjs # 单站 Cloudflare Pages 构建拼装
├── .github/workflows/
│   ├── ci.yml        # CI：统一平台测试 + Cloudflare 构建
│   └── deploy.yml     # Cloudflare 构建检查
├── DESIGN.md         # 红医师统一品牌、UI/UX、移动端原型和新项目接入契约
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

# 构建统一 Cloudflare Pages 站点（portal + fms + heat-stroke）
pnpm build:cloudflare

# 本地预览 Cloudflare Pages 输出
pnpm preview:cloudflare

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

## 统一入口平台

Cloudflare Pages 单站输出目录为 `.cloudflare/site`：

| 路径 | 来源 |
|------|------|
| `/` | `apps/portal` 静态导出 |
| `/fms/` | `apps/fms` Vite PWA |
| `/heat-stroke/` | `apps/heat-stroke` 静态 PWA |
| `/api/openweather` | `functions/api/openweather.js` |

`pnpm build:cloudflare` 会生成：

- `.cloudflare/site/_redirects`：统一站点路由和 FMS SPA fallback
- `.cloudflare/site/_headers`：静态资源缓存、安全响应头和 CSP 基线
- `.cloudflare/site/fms`：带 `/fms/` base path 的 FMS 产物
- `.cloudflare/site/heat-stroke`：带 `/heat-stroke/` 路径重写的热射病静态产物

新增项目入口时，优先更新 `apps/portal/src/lib/projects.ts`。首页项目网格与博客页项目入口共用该注册表，避免链接、封面、颜色和状态分散维护。

共享品牌设计元素从 `@hongyishi/ui` 导出：

- `hongyishiBrand`：红医师统一色彩、圆角、字体 token
- `hongyishiPlatformPaths`：统一入口平台的基础路径约定

UI/UX 重构先读根目录 `DESIGN.md`。新增项目接入按 `docs/adding-project.md` 执行。当前设计方向是“医疗指挥台 + 新构成主义”：保留各原项目内容创意和流程功能，统一品牌入口、状态表达、项目卡片、移动端触控尺度和安全/性能基线。

Cloudflare Pages 配置：

```text
Build command: pnpm build:cloudflare
Build output directory: .cloudflare/site
Secret: OPENWEATHER_API_KEY
```

仓库根目录的 `wrangler.jsonc` 记录 Pages 项目名、兼容日期和输出目录。Cloudflare 控制台仍需配置构建命令和 `OPENWEATHER_API_KEY` Secret；密钥不进入仓库。

上线前检查：

```bash
pnpm test:cloudflare
pnpm build:cloudflare
pnpm preview:cloudflare
```

本地预览至少检查以下路径：

- `/`
- `/fms/`
- `/fms/report`
- `/heat-stroke/`
- `/heat-stroke/pages/heat-index.html`
- `/heat-stroke/pages/field-treatment.html`
- `/heat-stroke/pages/8-4-6-rule.html`

检查标准：

- 页面可以打开，刷新深链不返回静态 404。
- 桌面和 375px 移动端没有横向溢出。
- 浏览器网络面板没有静态资源 404/500。
- `.cloudflare/site/heat-stroke/pages` 只包含 ASCII 页面名。
- 前端源码和部署产物不得暴露 OpenWeather API key；生产天气请求必须走 `/api/openweather`，并由 Cloudflare Pages Secret 提供 `OPENWEATHER_API_KEY`。

## CI/CD

- **CI**: 每次 push 到 main 和 PR 自动运行统一平台测试与 Cloudflare 构建
- **React 版本策略**: 所有 app 统一使用 `react@^18.3.0`，CI 确保不会有新版本混入
