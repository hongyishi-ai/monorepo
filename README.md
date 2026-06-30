# 红医师 monorepo

整合红医师旗下医疗训练、热风险处置和战场救护工具的统一代码仓库。当前主站已将门户、训练伤防治、热射病防治和战场救护整合为单一入口平台。

[![CI](https://github.com/hongyishi-ai/monorepo/actions/workflows/ci.yml/badge.svg)](https://github.com/hongyishi-ai/monorepo/actions)

## 项目结构

```
hongyishi-monorepo/
├── apps/
│   ├── portal/        # 红医师门户（Next.js 15 + React 18）
│   ├── fms/           # 训练伤防治平台（Vite + PWA + React 18）
│   ├── heat-stroke/   # 热射病防治平台（Next 首页 + 静态流程/PWA 资产）
│   └── tccc/          # 战场救护 TCCC 平台（Next 首页 + 静态流程/PWA 资产）
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

| 类别     | 技术                                                        |
| -------- | ----------------------------------------------------------- |
| 包管理   | PNPM 10                                                     |
| 构建协调 | Turborepo 2                                                 |
| 语言     | TypeScript 5（严格模式）                                    |
| UI 框架  | React 18.3.0                                                |
| SSR 框架 | Next.js 15（portal）                                        |
| 构建工具 | Vite 5/6                                                    |
| 设计系统 | `@hongyishi/config/tailwind` + `@hongyishi/ui` brand tokens |
| 代码规范 | ESLint 9 + Prettier 3                                       |
| 单元测试 | Vitest 2                                                    |

## 快速开始

```bash
# 安装依赖
pnpm install

# 开发所有项目
pnpm dev

# 构建所有项目
pnpm build

# 构建统一 Cloudflare Pages 站点（portal + fms + heat-stroke + tccc）
pnpm build:cloudflare

# 本地预览 Cloudflare Pages 输出
pnpm preview:cloudflare

# 检查内部路由、代表页面和移动端底部栏
pnpm audit:links

# 检查静态 HTML 孤立样式和旧首页链接债务
pnpm audit:static-debt

# 类型检查
pnpm type-check

# 运行所有测试
pnpm test

# 开发单个项目
pnpm --filter portal dev
pnpm --filter fms dev
pnpm --filter @hongyishi/heat-stroke dev
```

## 应用端口

| App         | 端口 | 访问                                                                        |
| ----------- | ---- | --------------------------------------------------------------------------- |
| portal      | 3000 | http://localhost:3000                                                       |
| fms         | 5175 | http://localhost:5175                                                       |
| heat-stroke | 3000 | Portal Next 路由 `/heat-stroke/`；静态深层页由 `pnpm build:cloudflare` 拼装 |
| tccc        | 3000 | Portal Next 路由 `/tccc/`；静态深层页由 `pnpm build:cloudflare` 拼装        |

## 统一入口平台

Cloudflare Pages 单站输出目录为 `.cloudflare/site`：

| 路径               | 来源                                                    |
| ------------------ | ------------------------------------------------------- |
| `/`                | `apps/portal` 静态导出                                  |
| `/fms/`            | `apps/fms` Vite PWA                                     |
| `/heat-stroke/`    | `apps/portal` Next 首页 + `apps/heat-stroke` 静态深层页 |
| `/tccc/`           | `apps/portal` Next 首页 + `apps/tccc` 静态深层页        |
| `/api/openweather` | `functions/api/openweather.js`                          |

`pnpm build:cloudflare` 会生成：

- `.cloudflare/site/_redirects`：统一站点路由和 FMS SPA fallback
- `.cloudflare/site/_headers`：静态资源缓存、安全响应头和 CSP 基线
- `.cloudflare/site/fms`：带 `/fms/` base path 的 FMS 产物
- `.cloudflare/site/heat-stroke`：Next 接管首页，保留带 `/heat-stroke/` 路径重写的热射病静态深层页与 PWA 资产
- `.cloudflare/site/tccc`：Next 接管首页，保留带 `/tccc/` 路径重写的 TCCC 静态深层页与 PWA 资产

新增项目入口时，优先更新 `apps/portal/src/lib/projects.json`，再通过 `apps/portal/src/lib/projects.ts` 暴露给 Portal。Cloudflare base path、内容治理、代表性审计路由和移动端导航审计期望由 `@hongyishi/config/project-registry` 从同一注册表派生，避免链接、封面、颜色、状态和审计规则分散维护。

共享品牌设计元素从 `@hongyishi/ui` 导出：

- `hongyishiBrand`：红医师统一色彩、圆角、字体 token
- `hongyishiPlatformPaths`：统一入口平台的基础路径约定

UI/UX 重构先读根目录 `DESIGN.md`。新增项目接入按 `docs/adding-project.md` 执行。当前设计方向是“医疗指挥台 + 新构成主义”：保留各原项目内容创意和流程功能，统一品牌入口、状态表达、项目卡片、移动端触控尺度和安全/性能基线。

技术栈统一策略：不做一次性框架重写。当前统一边界先放在项目注册表、`@hongyishi/config/project-registry`、共享品牌 token、`@hongyishi/config/tailwind`、Cloudflare 单站构建和 CI 门禁上；后续再让 Next.js 逐步接管子项目路由和页面运行时。`projectRuntimeContracts` 记录每个集成项目当前运行时、路由归属、Next 迁移阶段和风险等级，避免 Portal 在未迁移前抢占现有 `/fms/`、`/heat-stroke/`、`/tccc/` 产物路径。

Cloudflare Pages 配置：

```text
Build command: pnpm build:cloudflare
Build output directory: .cloudflare/site
Secret: OPENWEATHER_API_KEY
```

仓库根目录的 `wrangler.jsonc` 记录 Pages 项目名、兼容日期和输出目录。Cloudflare 控制台仍需配置构建命令和 `OPENWEATHER_API_KEY` Secret；密钥不进入仓库。

本地 Cloudflare Pages 预览需要在仓库根目录创建私有 `.dev.vars`：

```text
OPENWEATHER_API_KEY=<your-openweather-key>
```

`.dev.vars*` 已被 `.gitignore` 排除。没有本地密钥时，热指数页仍会提示使用温湿度手动计算。

上线前检查：

```bash
pnpm test:cloudflare
pnpm audit:static-debt
pnpm build:cloudflare
pnpm preview:cloudflare
pnpm audit:links -- --base=http://127.0.0.1:8788
```

每次代码变更完成并重新部署 Cloudflare Pages 后，必须更新 `docs/deployment-log.md`，记录 Git commit、Cloudflare Pages 部署 URL、生产域名和验证结果。只修改文档且未触发生产部署时，也应在相关提交说明中明确“未触发生产部署”。

本地预览至少检查以下路径：

- `/`
- `/fms/`
- `/fms/report`
- `/heat-stroke/`
- `/heat-stroke/pages/heat-index.html`
- `/heat-stroke/pages/field-treatment.html`
- `/heat-stroke/pages/8-4-6-rule.html`
- `/tccc/`
- `/tccc/pages/tccc-standard.html`

检查标准：

- 页面可以打开，刷新深链不返回静态 404。
- 桌面和 375px 移动端没有横向溢出。
- 浏览器网络面板没有静态资源 404/500。
- `.cloudflare/site/heat-stroke/pages` 只包含 ASCII 页面名。
- 前端源码和部署产物不得暴露 OpenWeather API key；生产天气请求必须走 `/api/openweather`，并由 Cloudflare Pages Secret 提供 `OPENWEATHER_API_KEY`。CSP 不允许前端直连 OpenWeather API。

## CI/CD

- **CI**: 每次 push 到 main 和 PR 自动运行统一平台测试与 Cloudflare 构建
- **React 版本策略**: 所有 app 统一使用 `react@^18.3.0`，CI 确保不会有新版本混入
