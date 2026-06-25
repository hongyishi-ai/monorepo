# Deployment Log

本文件记录 `hongyishi.cn` 当前线上版本与 Git 提交之间的对应关系。

规则：

- 每次代码变更完成并重新部署 Cloudflare Pages 后，必须在本文件顶部追加一条记录。
- 记录必须包含 Git commit、Cloudflare Pages 部署 URL、生产域名、部署方式和验证结果。
- 如果只修改仓库文档且没有重新部署生产站点，在对应提交说明中标注“未触发生产部署”。
- 不记录任何 secret、token、API key 或 Cloudflare 账号内部信息。

记录模板：

```md
## YYYY-MM-DD - <short commit> - <deployment summary>

- Commit: `<full-or-short-sha>`
- Branch: `main`
- Production: https://hongyishi.cn/
- Cloudflare deployment: https://<deployment-id>.hongyishi-monorepo.pages.dev
- Deploy method: `npx wrangler@<version> pages deploy .cloudflare/site --project-name=hongyishi-monorepo --branch=main`
- Verification:
  - `pnpm build:cloudflare`
  - `pnpm audit:links -- --base=https://hongyishi.cn`
  - GitHub Actions: CI / Cloudflare Build Check / Storybook / React Version Check
- Notes:
  - <what changed and why this deployment matters>
```

## 2026-06-25 - 4bfd902 - 移除使用引导并优化 FMS 检测辅助控件

- Commit: `4bfd902d03b32b87b92cad493b2f3cab3a5544e1`
- Branch: `main`
- Production: https://hongyishi.cn/
- Cloudflare deployment: https://3f34bbdf.hongyishi-monorepo.pages.dev
- Deploy method: `npx wrangler@4.103.0 pages deploy .cloudflare/site --project-name=hongyishi-monorepo --branch=main`
- Verification:
  - `pnpm --filter @hongyishi/fms type-check` passed
  - `pnpm test:cloudflare-build` passed: `27/27`
  - `pnpm lint` passed with existing FMS warnings: `0 errors, 24 warnings`
  - `pnpm test` passed: utils `18/18`, FMS `157/157`
  - `pnpm test:cloudflare` passed: `44/44`
  - `pnpm build:cloudflare` passed
  - `pnpm audit:links -- --base=http://127.0.0.1:3021` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - Mobile Playwright smoke passed: no guide remnants, demo/status controls visible, no bottom-nav overlap, both drawers open
  - `pnpm audit:links -- --base=https://3f34bbdf.hongyishi-monorepo.pages.dev` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - `pnpm audit:links -- --base=https://hongyishi.cn` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - `https://3f34bbdf.hongyishi-monorepo.pages.dev/` and `https://hongyishi.cn/` returned HTTP `200`
- Notes:
  - Removed FMS ProductTour, page guide panels, tour help buttons, and static heat stroke/TCCC guide injection.
  - Kept FMS per-test demo guidance and test status details, but changed their collapsed mobile presentation to compact production controls.
  - Link audit now treats guide surfaces as regressions while still validating FMS assessment assist controls.

## 2026-06-24 - ceabc1b - 首次使用引导统一与 FMS 引导抖动修复

- Commit: `ceabc1b5fa636a3300a3b243b6eb4269ffc560dc`
- Branch: `main`
- Production: https://hongyishi.cn/
- Cloudflare deployment: https://f97f5cb9.hongyishi-monorepo.pages.dev
- Deploy method: `npx wrangler@4.103.0 pages deploy .cloudflare/site --project-name=hongyishi-monorepo --branch=main`
- Verification:
  - `pnpm exec prettier --check apps/fms/src/components/ui/product-tour.tsx apps/fms/src/hooks/useProductTour.tsx apps/fms/src/components/ui/tour-help-button.tsx apps/fms/src/components/shared/FmsPage.tsx apps/fms/src/components/ui/demo-floating-button.tsx apps/fms/src/components/ui/smart-status-indicator.tsx apps/fms/src/index.css scripts/build-cloudflare.mjs scripts/build-cloudflare.test.mjs scripts/audit-links.mjs` passed
  - `pnpm lint` passed with existing FMS warnings: `0 errors, 24 warnings`
  - `pnpm type-check` passed
  - `pnpm test` passed: utils `18/18`, FMS `157/157`
  - `pnpm test:cloudflare` passed: `46/46`
  - `pnpm size:budget` passed: `391 files, 51.18 MiB total`
  - `pnpm build:cloudflare` passed
  - Mobile Playwright smoke passed: FMS assessment guide scroll range `0`, guide card/nav overlap `false`, assist control/nav overlap `false`
  - Static guide smoke passed for heat stroke field-treatment and TCCC standard: first-use auto open, reload suppression, manual replay, no bottom-nav overlap
  - `pnpm audit:links -- --base=http://127.0.0.1:4175` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, usage guides `15/15`
  - `pnpm audit:links -- --base=https://f97f5cb9.hongyishi-monorepo.pages.dev` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, usage guides `15/15`
  - `pnpm audit:links -- --base=https://hongyishi.cn` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, usage guides `15/15`
  - `https://hongyishi.cn/` returned HTTP `200`
- Notes:
  - FMS product tour now separates measuring from scrolling, so route/step changes no longer create a smooth-scroll feedback loop.
  - FMS, heat stroke, and TCCC usage guides now use first-use per-page storage and can be manually replayed without keeping large guide panels open.
  - Heat stroke and TCCC static rewrites now inject a shared spotlight guide runtime instead of persistent usage-guide sections.
  - FMS mobile assessment assist controls now stay above the bottom tab bar during guide and audit flows.

## 2026-06-24 - 222c20b - FMS 移动端辅助入口与使用引导统一

- Commit: `222c20bbb3bf1bb86b0d75d2a0383f75a842c1a6`
- Branch: `main`
- Production: https://hongyishi.cn/
- Cloudflare deployment: https://07fdb329.hongyishi-monorepo.pages.dev
- Deploy method: `npx wrangler@4.103.0 pages deploy .cloudflare/site --project-name=hongyishi-monorepo --branch=main`
- Verification:
  - `pnpm type-check` passed
  - `pnpm lint` passed with existing FMS warnings: `0 errors, 24 warnings`
  - `pnpm test` passed: utils `18/18`, FMS `157/157`
  - `pnpm test:cloudflare` passed: `46/46`
  - `pnpm size:budget` passed: `391 files, 50.80 MiB total`
  - `pnpm build:cloudflare` passed
  - `pnpm audit:links -- --base=https://07fdb329.hongyishi-monorepo.pages.dev` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, usage guides `15/15`
  - `pnpm audit:links -- --base=https://hongyishi.cn` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, usage guides `15/15`
  - `https://hongyishi.cn/` returned HTTP `200`
  - GitHub Actions passed for `222c20b`: CI, Cloudflare Build Check, Storybook, React Version Check
- Notes:
  - FMS mobile assessment no longer uses fixed bottom floating controls for demo and status details; mobile entries are in the page flow and the drawers render above the bottom tab bar.
  - FMS pages now share a Hongyishi-style page header, guide panel, empty state, metric cards, hard-border form controls, and route-aware product tour entries.
  - Heat stroke and TCCC deployment rewrites now inject concise project/page-specific usage guides, and link audits validate guide presence across representative routes.

## 2026-06-24 - 5aa816b - 子项目移动端导航与热射病控件统一

- Commit: `5aa816bfa4a3e2ebdfdc6a5522179f234ba6ffab`
- Branch: `main`
- Production: https://hongyishi.cn/
- Cloudflare deployment: https://bd1b0eb0.hongyishi-monorepo.pages.dev
- Deploy method: `npx wrangler@4.103.0 pages deploy .cloudflare/site --project-name=hongyishi-monorepo --branch=main`
- Verification:
  - `pnpm test:cloudflare` passed: `44/44`
  - `pnpm build:cloudflare` passed
  - `pnpm audit:links -- --base=https://bd1b0eb0.hongyishi-monorepo.pages.dev` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`
  - `pnpm audit:links -- --base=https://hongyishi.cn` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`
  - `https://hongyishi.cn/` returned HTTP `200`
  - GitHub Actions passed for `5aa816b`: CI, Cloudflare Build Check, Storybook, React Version Check
- Notes:
  - Heat stroke, TCCC, and FMS mobile bottom navigation now stays within the active subproject instead of returning to main-site tabs.
  - Heat stroke field-treatment timer, progress, and checkbox controls were restyled to match the Hongyishi visual system.
  - Mobile nav audit now validates project scope, labels, links, and absence of the old `主站` tab prefix.

## 2026-06-23 - c290607 - main 与 Cloudflare 生产站点对齐

- Commit: `c290607`
- Branch: `main`
- Production: https://hongyishi.cn/
- Cloudflare deployment: https://1986ecba.hongyishi-monorepo.pages.dev
- Deploy method: `npx wrangler@4.103.0 pages deploy .cloudflare/site --project-name=hongyishi-monorepo --branch=main`
- Verification:
  - `pnpm build:cloudflare` passed
  - `pnpm audit:links -- --base=https://hongyishi.cn` passed: internal `42/42`, representative `18/18`, mobile nav `6/6`
  - GitHub Actions passed: CI, Cloudflare Build Check, Storybook, React Version Check
  - `https://hongyishi.cn/` returned HTTP `200`
- Notes:
  - Recovered prior good mobile App Shell state was aligned to `main`.
  - Cloudflare production and GitHub `main` were synchronized.
  - Local Git remote was cleaned to remove embedded token from the remote URL.
