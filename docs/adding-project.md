# 新项目接入清单

本清单用于把新的红医师子项目接入 `hongyishi.cn` 单一入口平台。目标是减少散落项目的重复设计、重复部署和重复维护。

## 1. 判断接入类型

新增项先归入一种类型：

| 类型 | 适用情况 | 必须接入 |
|------|----------|----------|
| 站内项目 | 可静态构建或可复制为静态资源 | `apps/<project-id>`、入口注册表、Cloudflare 构建 |
| 外部项目 | 暂时保留独立域名或独立部署 | 入口注册表 |
| 辅助入口 | 播客、博客、文档、报告等非工具项目 | 入口注册表 |

当前优先站内项目是 `portal`、`fms`、`heat-stroke`。`pharmacy` 和 `clinic` 暂按外部项目保留。

## 2. 入口注册

所有首页、博客页和后续导航入口都应优先来自：

```text
apps/portal/src/lib/projects.json
apps/portal/src/lib/projects.ts
```

规则：

- 主平台项目写入 `projects.json` 的 `platformProjects`，必须提供 `coverImage`。
- 播客、文档等辅助入口写入 `projects.json` 的 `auxiliaryEntries`，不需要伪造封面图。
- `projects.ts` 负责导出类型化 helper，不把项目数据重复写一份。
- 站内项目使用相对路径，例如 `/fms/`、`/heat-stroke/`。
- 外部项目使用完整 URL，并保留 `status: 'external'`。

## 3. 品牌与 UI 约束

新增项目先读：

```text
DESIGN.md
packages/ui/src/brand/tokens.json
packages/ui/src/brand/index.ts
packages/ui/src/styles/variables.css
```

规则：

- 使用 `hongyishiBrand`、`hongyishiBrandCssVariables` 和 `--hys-*` CSS 变量。
- 不单独发明另一套主色或卡片样式。
- 首屏必须能返回总入口。
- 移动端 375px 宽度不得横向溢出。
- 医疗风险、适用边界、错误状态和下一步动作必须清楚。

## 4. Cloudflare 接入

如果项目要进入单一 Cloudflare Pages 站点，更新：

```text
scripts/build-cloudflare.mjs
scripts/build-cloudflare.test.mjs
scripts/project-registry.test.mjs
wrangler.jsonc
README.md
```

构建要求：

- 子项目必须支持 base path，或在构建脚本中安全重写资源路径。
- 静态资源放在项目 base path 下，例如 `/new-project/assets/...`。
- SPA 深链需要 fallback。
- 中文文件名、空格文件名或特殊字符文件名要在部署产物中映射为 URL 安全路径。
- 需要第三方 API 时，优先通过 `functions/api/*` 代理，不在前端暴露密钥。
- 新增 `status: "integrated"` 项目后，必须让 `scripts/project-registry.test.mjs` 识别它的站内 base path，并在 Cloudflare 构建脚本中生成对应产物。
- `wrangler.jsonc` 只保存 Pages 项目配置，不保存 `OPENWEATHER_API_KEY` 等密钥。

## 5. 验证命令

接入完成后至少运行：

```bash
pnpm test:cloudflare
pnpm build:cloudflare
pnpm preview:cloudflare
```

本地预览中至少检查：

- `/` 首页能看到新入口。
- 新项目入口能打开。
- 深链能刷新不 404。
- 桌面和 375px 移动端没有横向溢出。
- 控制台没有静态资源 404/500。

涉及医疗输入、天气、诊断或药品数据时，还要补关键流程测试和错误状态测试。
