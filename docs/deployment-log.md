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

## 2026-06-30 - 67abd11 - Next 路由归属交接保护

- Commit: `67abd11f897f867f999b3560f1faf3a9057b3441`
- Branch: `main`
- Production: https://hongyishi.cn/
- Cloudflare deployment: https://6de45b38.hongyishi-monorepo.pages.dev
- Deploy method: `npx wrangler@4.105.0 pages deploy .cloudflare/site --project-name=hongyishi-monorepo --branch=main --commit-dirty=true`
- Verification:
  - `node --test scripts/project-registry.test.mjs` passed: `9/9`
  - `pnpm exec prettier --check README.md docs/adding-project.md packages/config/project-registry.mjs scripts/project-registry.test.mjs` passed
  - `pnpm test:cloudflare` passed: `54/54`
  - `pnpm build:cloudflare` passed
  - `pnpm size:budget` passed: `392 files, 51.34 MiB total`
  - `HONGYISHI_AUDIT_BASE_URL=https://6de45b38.hongyishi-monorepo.pages.dev pnpm audit:links` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - `HONGYISHI_AUDIT_BASE_URL=https://hongyishi.cn pnpm audit:links` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
- Notes:
  - Added `projectRuntimeContracts` to record each integrated project's current runtime, route owner, Next migration stage, and migration risk.
  - Added a registry test that scans Portal top-level routes and prevents `/fms/`, `/heat-stroke/`, or `/tccc/` from being claimed by Next before `routeOwner` is explicitly changed to `next`.
  - This is a migration safety gate only; it does not change current user-facing URLs or child app business logic.

## 2026-06-30 - a9eb898 - 共享项目注册表契约

- Commit: `a9eb89877be9da01f0b9b8540f1f51c5257c64b8`
- Branch: `main`
- Production: https://hongyishi.cn/
- Cloudflare deployment: https://2eed39f3.hongyishi-monorepo.pages.dev
- Deploy method: `npx wrangler@4.105.0 pages deploy .cloudflare/site --project-name=hongyishi-monorepo --branch=main --commit-dirty=true`
- Verification:
  - `pnpm exec prettier --check README.md docs/adding-project.md packages/config/package.json packages/config/project-registry.mjs scripts/build-cloudflare.mjs scripts/audit-links.mjs scripts/project-registry.test.mjs` passed
  - `pnpm test:cloudflare` passed: `53/53`
  - `pnpm build:cloudflare` passed
  - `pnpm size:budget` passed: `392 files, 51.34 MiB total`
  - `HONGYISHI_AUDIT_BASE_URL=http://127.0.0.1:3021 pnpm audit:links` against local Pages preview passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - `HONGYISHI_AUDIT_BASE_URL=https://2eed39f3.hongyishi-monorepo.pages.dev pnpm audit:links` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - `HONGYISHI_AUDIT_BASE_URL=https://hongyishi.cn pnpm audit:links` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
- Notes:
  - Added `@hongyishi/config/project-registry` as the shared contract layer for Cloudflare base paths, content governance, representative audit routes, and mobile navigation audit expectations.
  - `scripts/build-cloudflare.mjs` and `scripts/audit-links.mjs` now consume shared registry-derived contracts instead of keeping duplicate routing and audit rules.
  - Updated project onboarding documentation to point future integrated projects at the shared registry contract before changing build or audit scripts.

## 2026-06-30 - c7f3627 - 共享静态项目移动导航激活态解析

- Commit: `c7f36275f16be98daeb55b48d99b0400f71f7c27`
- Branch: `main`
- Production: https://hongyishi.cn/
- Cloudflare deployment: https://3c304170.hongyishi-monorepo.pages.dev
- Deploy method: `HTTPS_PROXY=http://127.0.0.1:7897 HTTP_PROXY=http://127.0.0.1:7897 ALL_PROXY=http://127.0.0.1:7897 npx wrangler@4.105.0 pages deploy .cloudflare/site --project-name=hongyishi-monorepo --branch=main`
- Verification:
  - `node --test scripts/project-registry.test.mjs scripts/build-cloudflare.test.mjs` passed: `38/38`
  - `pnpm test:cloudflare` passed: `53/53`
  - `pnpm build:cloudflare` passed
  - `pnpm size:budget` passed: `392 files, 51.34 MiB total`
  - `pnpm audit:links` against local Pages preview passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - `HONGYISHI_AUDIT_BASE_URL=https://3c304170.hongyishi-monorepo.pages.dev pnpm audit:links` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - `HONGYISHI_AUDIT_BASE_URL=https://hongyishi.cn pnpm audit:links` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
- Notes:
  - Moved static project bottom-nav active tab and top-menu active item resolution into `@hongyishi/config/app-shell/mobile-nav`.
  - `scripts/build-cloudflare.mjs` now consumes shared app-shell mobile navigation state helpers instead of keeping its own heat-stroke/TCCC active-state mapping.
  - The first deploy attempt failed before upload because the current shell did not inherit the macOS proxy while DNS returned a `198.18.x.x` fake-ip; rerunning Wrangler with explicit proxy environment variables succeeded.

## 2026-06-28 - e668b37 - 静态项目移动端顶部控件与主题统一

- Commit: `e668b3742cbd21a559f0855d1d560550867a860a`
- Branch: `main`
- Production: https://hongyishi.cn/
- Cloudflare deployment: https://a5aca380.hongyishi-monorepo.pages.dev
- Deploy method: `npx wrangler@4.105.0 pages deploy .cloudflare/site --project-name=hongyishi-monorepo --branch=main`
- Verification:
  - `pnpm exec prettier --check scripts/build-cloudflare.mjs scripts/build-cloudflare.test.mjs scripts/audit-links.mjs` passed
  - `pnpm test:cloudflare` passed: `48/48`
  - `npm run build:cloudflare` passed
  - `node scripts/audit-links.mjs --base=http://127.0.0.1:3021` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - Mobile Playwright computed-style check passed for `/heat-stroke/` and `/tccc/`: header controls are inside `.brand-nav`, nav direction is `row`, theme/menu font size is `16px`, controls are about `49x48`, and dark mode changes `main` background to `rgb(15, 23, 26)` with text `rgb(244, 236, 220)`
  - `node scripts/audit-links.mjs --base=https://a5aca380.hongyishi-monorepo.pages.dev` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - `node scripts/audit-links.mjs --base=https://hongyishi.cn` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - `https://hongyishi.cn/` returned HTTP `200`
  - GitHub Actions passed for `e668b37`: CI, Cloudflare Build Check, Storybook, React Version Check
- Notes:
  - Heat stroke mobile header controls now use the same FMS-style `hys-nav-link` and `t-icon-swap h-5 w-5 place-items-center` structure instead of Font Awesome-specific buttons.
  - TCCC now gets the same top-right theme toggle and hamburger menu, with core TCCC links in the expanded panel while keeping the bottom four-item nav.
  - Static-project dark mode now covers page content as well as the app shell, including heat stroke `.project-shell` content and TCCC pages.

## 2026-06-28 - 7f9ae7e - 热射病移动端菜单改为 FMS 式顶部面板

- Commit: `7f9ae7ed3d5701dacb56229c46f83d5757cb2954`
- Branch: `main`
- Production: https://hongyishi.cn/
- Cloudflare deployment: https://d4712911.hongyishi-monorepo.pages.dev
- Deploy method: `npx wrangler@4.105.0 pages deploy .cloudflare/site --project-name=hongyishi-monorepo --branch=main`
- Verification:
  - `node --test scripts/build-cloudflare.test.mjs` passed: `28/28`
  - `pnpm test:cloudflare` passed: `48/48`
  - `pnpm build:cloudflare` passed
  - `pnpm audit:links -- --base=http://127.0.0.1:8788` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - Mobile Playwright interaction check passed for `/heat-stroke/pages/field-treatment`: top menu is inside `.brand-nav`, position is `static`, panel opens below the header, bottom nav remains `热指数`, `处置`, `法则`, `资料`, and no horizontal overflow
  - Mobile theme toggle check passed for `/heat-stroke/`: `light` toggled to `dark`, `html.dark` was applied, and `hys:heatStroke:theme` was saved to `localStorage`
  - `pnpm audit:links -- --base=https://d4712911.hongyishi-monorepo.pages.dev` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - `pnpm audit:links -- --base=https://hongyishi.cn` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - GitHub Actions passed for `7f9ae7e`: CI, Cloudflare Build Check, Storybook, React Version Check
- Notes:
  - Heat stroke mobile menu now matches the FMS pattern: brand row, theme toggle, blue menu/close control, and a full-width menu panel below the header instead of a floating standalone button.
  - The previous top links and broader heat-stroke content links remain inside the hamburger panel.
  - Mobile nav audit now checks that the heat-stroke menu is embedded in `.brand-nav`, is not `fixed`, has a theme toggle, and still hides `.brand-nav-links` on mobile.

## 2026-06-28 - 90fed4b - 热射病移动端顶部入口并入汉堡菜单

- Commit: `90fed4b1ccedf2c57c81351e0012c31fcd95603c`
- Branch: `main`
- Production: https://hongyishi.cn/
- Cloudflare deployment: https://13f75d62.hongyishi-monorepo.pages.dev
- Deploy method: `npx wrangler@4.105.0 pages deploy .cloudflare/site --project-name=hongyishi-monorepo --branch=main`
- Verification:
  - `node --test scripts/build-cloudflare.test.mjs` passed: `28/28`
  - `pnpm test:cloudflare` passed: `48/48`
  - `pnpm build:cloudflare` passed
  - `pnpm audit:links -- --base=http://127.0.0.1:8788` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - Mobile Playwright interaction check passed for `/heat-stroke/pages/field-treatment`: hamburger menu opened with `总入口`, `项目首页`, and guide links; bottom nav kept `热指数`, `处置`, `法则`, `资料`; visible `.brand-nav-links` count was `0`
  - `pnpm audit:links -- --base=https://13f75d62.hongyishi-monorepo.pages.dev` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - `pnpm audit:links -- --base=https://hongyishi.cn` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - GitHub Actions passed for `90fed4b`: CI, Cloudflare Build Check, Storybook, React Version Check
- Notes:
  - Heat stroke mobile now keeps the bottom four-item navigation focused on the core flows.
  - The top-right hamburger menu now carries the former top links (`总入口`, `项目首页`) plus the broader heat-stroke content links such as diagnosis/treatment guideline, consensus, heat tolerance, cooling, challenge, and about.
  - Mobile link audit now validates the heat-stroke hamburger menu contract and fails if the old `.brand-nav-links` remain visible on mobile.

## 2026-06-27 - 4cdf411 - 共享品牌 token 与 Tailwind preset

- Commit: `4cdf411727f6b2427c02cbf73075c9e412570e57`
- Branch: `main`
- Production: https://hongyishi.cn/
- Cloudflare deployment: https://18a4f36e.hongyishi-monorepo.pages.dev
- Deploy method: `npx wrangler@4.105.0 pages deploy .cloudflare/site --project-name=hongyishi-monorepo --branch=main`
- Verification:
  - `node --test scripts/brand-tokens.test.mjs` passed: `5/5`
  - `pnpm type-check` passed
  - `pnpm lint` passed with existing FMS warnings: `0 errors, 24 warnings`
  - `pnpm test` passed: utils `18/18`, FMS `157/157`
  - `pnpm build:cloudflare` passed
  - `pnpm size:budget` passed: `392 files, 50.68 MiB total`
  - `pnpm test:cloudflare` passed: `47/47`
  - `pnpm audit:links -- --base=https://18a4f36e.hongyishi-monorepo.pages.dev` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - `pnpm audit:links -- --base=https://hongyishi.cn` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - `https://18a4f36e.hongyishi-monorepo.pages.dev/` and `https://hongyishi.cn/` returned HTTP `200`
- Notes:
  - Moved the shared brand token JSON into `@hongyishi/config` and exported it as `@hongyishi/config/brand/tokens.json`.
  - Added `@hongyishi/config/tailwind` as the shared Tailwind preset for Portal, FMS, heat-stroke, TCCC, and the UI package.
  - Documented the runtime-unification rule: keep Portal on Next static export, FMS on Vite React, and heat-stroke/TCCC as static HTML/Tailwind until complexity justifies migration.

## 2026-06-26 - d70797e - 撤回主题切换统一修改

- Commit: `d70797e07d237c72d751b9384da53b25775b7885`
- Branch: `main`
- Production: https://hongyishi.cn/
- Cloudflare deployment: https://725231cf.hongyishi-monorepo.pages.dev
- Deploy method: `npx wrangler@4.105.0 pages deploy .cloudflare/site --project-name=hongyishi-monorepo --branch=main`
- Verification:
  - `pnpm --filter @hongyishi/fms type-check` passed
  - `pnpm test:cloudflare` passed: `44/44`
  - `pnpm build:cloudflare` passed
  - `pnpm lint` passed with existing FMS warnings: `0 errors, 24 warnings`
  - `pnpm audit:links -- --base=http://127.0.0.1:3021` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - `pnpm audit:links -- --base=https://725231cf.hongyishi-monorepo.pages.dev` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - `pnpm audit:links -- --base=https://hongyishi.cn` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
- Notes:
  - Reverted `b60047e` and `8d6ff83` after the unified theme switching experience was judged unsatisfactory.
  - Restored the previous Portal/FMS theme behavior and removed the static heat stroke/TCCC theme runtime injection.
  - Removed the temporary theme-control audit extension and FMS theme hook tests introduced by the reverted change.

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
