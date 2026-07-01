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

## 2026-07-01 - da6fb23 - 热射病热耐力评估页 Next 接管

- Commit: `da6fb235e5c6a5e649333c84e949d9e9b85e66f5`
- Branch: `main`
- Production: https://hongyishi.cn/
- Cloudflare deployment: https://8b2912e6.hongyishi-monorepo.pages.dev
- Deploy method: `npx wrangler@4.106.0 pages deploy .cloudflare/site --project-name=hongyishi-monorepo --branch=main`
- Verification:
  - Red-green checks: `pnpm exec node --test scripts/build-cloudflare.test.mjs` first failed because `pages/heat-tolerance.html` was not in the default Next-owned heat-stroke deep-page set; after implementation it passed
  - Red-green checks: `pnpm exec node --test scripts/project-registry.test.mjs` first failed because `/heat-stroke/pages/heat-tolerance` was not in representative audit routes and the migration stage was stale; after implementation it passed
  - `pnpm --filter @hongyishi/portal type-check` passed
  - `pnpm audit:static-debt` passed: heat-stroke `4` HTML files, `3` style blocks, `21` style attrs, `0` legacy home links; TCCC unchanged at `26` HTML files, `26` style blocks, `25` style attrs, `0` legacy home links
  - `pnpm test:cloudflare` passed: `63/63`
  - `pnpm build:cloudflare` passed and exported `/heat-stroke/pages/heat-tolerance`
  - `pnpm size:budget` passed: `410 files, 51.88 MiB total`
  - Build output checks passed: `.cloudflare/site/heat-stroke/pages/heat-tolerance.html` exists and `.cloudflare/site/heat-stroke/pages/热耐力评估.html` does not exist
  - Local Pages preview `HONGYISHI_AUDIT_BASE_URL=http://127.0.0.1:3024 pnpm audit:links` passed: internal `37/37`, representative `23/23`, mobile nav `6/6`, guide surfaces `15/15`
  - Playwright mobile smoke passed on `/heat-stroke/pages/heat-tolerance`: project shell present, hamburger menu active item `热耐力评估`, bottom nav active item `资料`, no 390px horizontal overflow, day/night toggle switched the page to dark mode, validation warning displayed before answering, BMI `175/70` auto-scored Q1 as `4`, selecting Q2-Q18 value `5` produced total score `89` and interpretation `评估结果：耐热能力优秀`
  - The first Playwright smoke caught missing `id="height"` and `id="weight"` on the migrated inputs; the DOM contract was restored and the smoke was rerun successfully
  - `https://8b2912e6.hongyishi-monorepo.pages.dev/heat-stroke/pages/heat-tolerance` returned HTTP `200` with the Next project shell, page title, assessment form markers, and no old `热耐力评估.html` reference
  - `HONGYISHI_AUDIT_BASE_URL=https://8b2912e6.hongyishi-monorepo.pages.dev pnpm audit:links` passed: internal `37/37`, representative `23/23`, mobile nav `6/6`, guide surfaces `15/15`
  - `https://hongyishi.cn/heat-stroke/pages/heat-tolerance` returned HTTP `200` with the Next project shell, page title, assessment form markers, and no old `热耐力评估.html` reference
  - `HONGYISHI_AUDIT_BASE_URL=https://hongyishi.cn pnpm audit:links` passed: internal `37/37`, representative `23/23`, mobile nav `6/6`, guide surfaces `15/15`
- Notes:
  - Moved heat-stroke `热耐力评估` from standalone static HTML into the Portal Next app at `/heat-stroke/pages/heat-tolerance`, preserving the original BMI auto-selection, 18-question scoring, total-score calculation, and interpretation thresholds.
  - Deleted the old static heat-tolerance HTML source and repointed remaining heat-stroke links and service-worker cache entries to `/heat-stroke/pages/heat-tolerance`.
  - Tightened the heat-stroke static debt baseline from `4` to `3` style blocks and updated the migration stage to `next-home-about-rule-guide-consensus-cooling-and-tolerance-owned-static-deep-pages-pending`.

## 2026-07-01 - e7677ad - 热射病核心体温与降温页 Next 接管

- Commit: `e7677adc12c68dcf675ce164e4ffd5122d538642`
- Branch: `main`
- Production: https://hongyishi.cn/
- Cloudflare deployment: https://b7bdb491.hongyishi-monorepo.pages.dev
- Deploy method: `npx wrangler@4.106.0 pages deploy .cloudflare/site --project-name=hongyishi-monorepo --branch=main`
- Verification:
  - Red-green checks: `pnpm exec node --test scripts/build-cloudflare.test.mjs` first failed because `pages/core-temperature-cooling.html` was not in the default Next-owned heat-stroke deep-page set; after implementation it passed
  - Red-green checks: `pnpm exec node --test scripts/project-registry.test.mjs` first failed because `/heat-stroke/pages/core-temperature-cooling` was not in representative audit routes and the migration stage was stale; after implementation it passed
  - `pnpm --filter @hongyishi/portal type-check` passed
  - `pnpm audit:static-debt` passed: heat-stroke `5` HTML files, `4` style blocks, `21` style attrs, `0` legacy home links; TCCC unchanged at `26` HTML files, `26` style blocks, `25` style attrs, `0` legacy home links
  - `pnpm test:cloudflare` passed: `62/62`
  - `pnpm build:cloudflare` passed and exported `/heat-stroke/pages/core-temperature-cooling`
  - `pnpm size:budget` passed: `408 files, 51.87 MiB total`
  - Local Pages preview `HONGYISHI_AUDIT_BASE_URL=http://127.0.0.1:3023 pnpm audit:links` passed: internal `37/37`, representative `22/22`, mobile nav `6/6`, guide surfaces `15/15`
  - Playwright mobile smoke passed on `/heat-stroke/pages/core-temperature-cooling`: project shell present, key monitoring and cooling sections visible, bottom nav active item `资料`, hamburger menu active href `/heat-stroke/pages/core-temperature-cooling`, no 390px horizontal overflow, day/night toggle updates page and cards, and back-to-top works
  - `https://b7bdb491.hongyishi-monorepo.pages.dev/heat-stroke/pages/core-temperature-cooling` returned HTTP `200` with the Next project shell, page title, key cooling content, and no old `热射病核心体温监测与降温方法.html` reference
  - `HONGYISHI_AUDIT_BASE_URL=https://b7bdb491.hongyishi-monorepo.pages.dev pnpm audit:links` passed: internal `37/37`, representative `22/22`, mobile nav `6/6`, guide surfaces `15/15`
  - `https://hongyishi.cn/heat-stroke/pages/core-temperature-cooling` returned HTTP `200` with the Next project shell, page title, key cooling content, and no old `热射病核心体温监测与降温方法.html` reference
  - `HONGYISHI_AUDIT_BASE_URL=https://hongyishi.cn pnpm audit:links` passed: internal `37/37`, representative `22/22`, mobile nav `6/6`, guide surfaces `15/15`
- Notes:
  - Moved heat-stroke `热射病核心体温监测与降温方法` from standalone static HTML into the Portal Next app at `/heat-stroke/pages/core-temperature-cooling`, reusing the shared `ProjectChrome` navigation and day/night theme behavior.
  - Deleted the old static core-temperature cooling HTML source and repointed remaining heat-stroke links and service-worker cache entries to `/heat-stroke/pages/core-temperature-cooling`.
  - Tightened the heat-stroke static debt baseline from `5` to `4` style blocks and updated the migration stage to `next-home-about-rule-guide-consensus-and-cooling-owned-static-deep-pages-pending`.

## 2026-07-01 - d02afce - 热射病救治体系共识页 Next 接管

- Commit: `d02afce42423d345a7348e399cac6623215a56e8`
- Branch: `main`
- Production: https://hongyishi.cn/
- Cloudflare deployment: https://678887af.hongyishi-monorepo.pages.dev
- Deploy method: `npx wrangler@4.106.0 pages deploy .cloudflare/site --project-name=hongyishi-monorepo --branch=main`
- Verification:
  - Red-green checks: `pnpm exec node --test scripts/build-cloudflare.test.mjs` first failed because `pages/treatment-system-consensus.html` was not in the default Next-owned heat-stroke deep-page set; after implementation it passed
  - Red-green checks: `pnpm exec node --test scripts/project-registry.test.mjs` first failed because `/heat-stroke/pages/treatment-system-consensus` was not in representative audit routes and the migration stage was stale; after implementation it passed
  - `pnpm --filter @hongyishi/portal type-check` passed
  - `pnpm audit:static-debt` passed: heat-stroke `6` HTML files, `5` style blocks, `21` style attrs, `0` legacy home links; TCCC unchanged at `26` HTML files, `26` style blocks, `25` style attrs, `0` legacy home links
  - `pnpm test:cloudflare` passed: `62/62`
  - `pnpm build:cloudflare` passed and exported `/heat-stroke/pages/treatment-system-consensus`
  - `pnpm size:budget` passed: `406 files, 51.83 MiB total`
  - Local Pages preview `HONGYISHI_AUDIT_BASE_URL=http://127.0.0.1:3022 pnpm audit:links` passed: internal `37/37`, representative `21/21`, mobile nav `6/6`, guide surfaces `15/15`
  - Playwright mobile smoke passed on `/heat-stroke/pages/treatment-system-consensus`: project shell present, key consensus sections visible, bottom nav active item `资料`, hamburger menu active href `/heat-stroke/pages/treatment-system-consensus`, no 390px horizontal overflow, day/night toggle updates page and cards, and back-to-top works
  - `https://678887af.hongyishi-monorepo.pages.dev/heat-stroke/pages/treatment-system-consensus` returned HTTP `200` with the Next project shell and page title
  - `HONGYISHI_AUDIT_BASE_URL=https://678887af.hongyishi-monorepo.pages.dev pnpm audit:links` passed: internal `37/37`, representative `21/21`, mobile nav `6/6`, guide surfaces `15/15`
  - `https://hongyishi.cn/heat-stroke/pages/treatment-system-consensus` returned HTTP `200` with the Next project shell and page title
  - `HONGYISHI_AUDIT_BASE_URL=https://hongyishi.cn pnpm audit:links` passed: internal `37/37`, representative `21/21`, mobile nav `6/6`, guide surfaces `15/15`
- Notes:
  - Moved heat-stroke `热射病救治体系建设标准专家共识` from standalone static HTML into the Portal Next app at `/heat-stroke/pages/treatment-system-consensus`, reusing the shared `ProjectChrome` navigation and day/night theme behavior.
  - Deleted the old static consensus HTML source and repointed remaining heat-stroke links and service-worker cache entries to `/heat-stroke/pages/treatment-system-consensus`.
  - Tightened the heat-stroke static debt baseline from `6` to `5` style blocks and from `29` to `21` inline style attributes, and updated the migration stage to `next-home-about-rule-guide-and-consensus-owned-static-deep-pages-pending`.

## 2026-07-01 - ebcd789 - 热射病诊断与治疗指南页 Next 接管

- Commit: `ebcd789f43cb8c56891063dc50088157fb722120`
- Branch: `main`
- Production: https://hongyishi.cn/
- Cloudflare deployment: https://a33b71bf.hongyishi-monorepo.pages.dev
- Deploy method: `npx wrangler@4.106.0 pages deploy .cloudflare/site --project-name=hongyishi-monorepo --branch=main`
- Verification:
  - Red-green checks: `pnpm exec node --test scripts/build-cloudflare.test.mjs` first failed because `pages/diagnosis-treatment-guideline.html` was not in the default Next-owned heat-stroke deep-page set; after implementation it passed
  - Red-green checks: `pnpm exec node --test scripts/project-registry.test.mjs` first failed because the heat-stroke migration stage still only mentioned home, About, and 8-4-6 ownership; after implementation it passed
  - `pnpm --filter @hongyishi/portal type-check` passed
  - `pnpm audit:static-debt` passed: heat-stroke `7` HTML files, `6` style blocks, `29` style attrs, `0` legacy home links; TCCC unchanged at `26` HTML files, `26` style blocks, `25` style attrs, `0` legacy home links
  - `pnpm test:cloudflare` passed: `62/62`
  - `pnpm build:cloudflare` passed and exported `/heat-stroke/pages/diagnosis-treatment-guideline`
  - `pnpm size:budget` passed: `404 files, 51.75 MiB total`
  - Local Pages preview `HONGYISHI_AUDIT_BASE_URL=http://127.0.0.1:3021 pnpm audit:links` passed: internal `37/37`, representative `20/20`, mobile nav `6/6`, guide surfaces `15/15`
  - Playwright mobile smoke passed on `/heat-stroke/pages/diagnosis-treatment-guideline`: project shell present, bottom nav active item `资料`, hamburger menu active href `/heat-stroke/pages/diagnosis-treatment-guideline`, no 390px horizontal overflow, day/night toggle updates page and cards, and back-to-top works
  - `https://a33b71bf.hongyishi-monorepo.pages.dev/heat-stroke/pages/diagnosis-treatment-guideline` returned HTTP `200` with the Next project shell and no old `中国热射病诊断与治疗指南.html` reference
  - `HONGYISHI_AUDIT_BASE_URL=https://a33b71bf.hongyishi-monorepo.pages.dev pnpm audit:links` passed: internal `37/37`, representative `20/20`, mobile nav `6/6`, guide surfaces `15/15`
  - `https://hongyishi.cn/heat-stroke/pages/diagnosis-treatment-guideline` returned HTTP `200` with the Next project shell and no old `中国热射病诊断与治疗指南.html` reference
  - `HONGYISHI_AUDIT_BASE_URL=https://hongyishi.cn pnpm audit:links` passed: internal `37/37`, representative `20/20`, mobile nav `6/6`, guide surfaces `15/15`
- Notes:
  - Moved heat-stroke `中国热射病诊断与治疗指南` from standalone static HTML into the Portal Next app at `/heat-stroke/pages/diagnosis-treatment-guideline`, reusing the shared `ProjectChrome` navigation and day/night theme behavior.
  - Deleted the old static guideline HTML source and repointed remaining heat-stroke links and service-worker cache entries to `/heat-stroke/pages/diagnosis-treatment-guideline`.
  - Tightened the heat-stroke static debt baseline from `7` to `6` style blocks and from `43` to `29` inline style attributes, and updated the migration stage to `next-home-about-rule-and-guide-owned-static-deep-pages-pending`.

## 2026-06-30 - c1e80ec - 热射病 8-4-6 法则页 Next 接管

- Commit: `c1e80ecf381bc4b08b556a6ec74e776756a01bf9`
- Branch: `main`
- Production: https://hongyishi.cn/
- Cloudflare deployment: https://3c0b56fd.hongyishi-monorepo.pages.dev
- Deploy method: `npx wrangler@4.105.0 pages deploy .cloudflare/site --project-name=hongyishi-monorepo --branch=main`
- Verification:
  - Red-green checks: `pnpm exec node --test scripts/build-cloudflare.test.mjs` first failed because `pages/8-4-6-rule.html` was not in the default Next-owned heat-stroke deep-page set; after implementation it passed
  - Red-green checks: `pnpm exec node --test scripts/project-registry.test.mjs` first failed because the heat-stroke migration stage still only mentioned home and About ownership; after implementation it passed
  - `pnpm --filter @hongyishi/portal type-check` passed
  - `pnpm audit:static-debt` passed: heat-stroke `8` HTML files, `7` style blocks, `43` style attrs, `0` legacy home links; TCCC unchanged at `26` HTML files, `26` style blocks, `25` style attrs, `0` legacy home links
  - `pnpm test:cloudflare` passed: `62/62`
  - `pnpm build:cloudflare` passed and exported `/heat-stroke/pages/8-4-6-rule`
  - `pnpm size:budget` passed: `402 files, 51.57 MiB total`
  - Local Pages preview `HONGYISHI_AUDIT_BASE_URL=http://127.0.0.1:3021 pnpm audit:links` passed: internal `37/37`, representative `19/19`, mobile nav `6/6`, guide surfaces `15/15`
  - Playwright mobile smoke passed on `/heat-stroke/pages/8-4-6-rule`: project shell present, bottom nav active href `/heat-stroke/pages/8-4-6-rule`, hamburger menu includes the deeper guide links, no 390px horizontal overflow, day/night toggle updates the whole page palette, and back-to-top works
  - `https://3c0b56fd.hongyishi-monorepo.pages.dev/heat-stroke/pages/8-4-6-rule` returned HTTP `200` with the Next project shell and no old `8-4-6黄金法则.html` reference
  - `HONGYISHI_AUDIT_BASE_URL=https://3c0b56fd.hongyishi-monorepo.pages.dev pnpm audit:links` passed: internal `37/37`, representative `19/19`, mobile nav `6/6`, guide surfaces `15/15`
  - `https://hongyishi.cn/heat-stroke/pages/8-4-6-rule` returned HTTP `200` with the Next project shell and no old `8-4-6黄金法则.html` reference
  - `HONGYISHI_AUDIT_BASE_URL=https://hongyishi.cn pnpm audit:links` passed: internal `37/37`, representative `19/19`, mobile nav `6/6`, guide surfaces `15/15`
- Notes:
  - Moved heat-stroke `8-4-6黄金法则` from standalone static HTML into the Portal Next app at `/heat-stroke/pages/8-4-6-rule`, reusing the shared `ProjectChrome` navigation and day/night theme behavior.
  - Deleted the old static 8-4-6 HTML source and repointed remaining heat-stroke links and service-worker cache entries to `/heat-stroke/pages/8-4-6-rule`.
  - Tightened the heat-stroke static debt baseline from `8` to `7` style blocks and updated the migration stage to `next-home-about-and-rule-owned-static-deep-pages-pending`.

## 2026-06-30 - 5bf8380 - 热射病 About 深层页 Next 接管

- Commit: `5bf83801d2d6bb7fc43397a87a0ee7932e466fd6`
- Branch: `main`
- Production: https://hongyishi.cn/
- Cloudflare deployment: https://0e7c4edf.hongyishi-monorepo.pages.dev
- Deploy method: `npx wrangler@4.105.0 pages deploy .cloudflare/site --project-name=hongyishi-monorepo --branch=main --commit-dirty=true`
- Verification:
  - Red-green checks: `pnpm exec node --test scripts/build-cloudflare.test.mjs` first failed because `pages/关于本项目.html` still copied over the Next route; after implementation it passed: `34/34`
  - Red-green checks: `pnpm exec node --test scripts/project-registry.test.mjs` first failed because `/heat-stroke/pages/about` was not a representative audit route and the migration stage was stale; after implementation it passed: `9/9`
  - `pnpm --filter @hongyishi/portal type-check` passed
  - `pnpm audit:static-debt` passed: heat-stroke `9` HTML files, `8` style blocks, `43` style attrs, `0` legacy home links; TCCC unchanged at `26` style blocks, `25` style attrs, `0` legacy home links
  - `pnpm test:cloudflare` passed: `61/61`
  - `pnpm build:cloudflare` passed and exported `/heat-stroke/pages/about`
  - `pnpm size:budget` passed: `400 files, 51.54 MiB total`
  - Local Pages preview `HONGYISHI_AUDIT_BASE_URL=http://127.0.0.1:3021 pnpm audit:links` passed: internal `37/37`, representative `19/19`, mobile nav `6/6`, guide surfaces `15/15`
  - Playwright mobile smoke passed on `/heat-stroke/pages/about`: project shell present, bottom nav fixed, top menu active item `/heat-stroke/pages/about`, no horizontal overflow at 390px, theme storage and `html.dark` update correctly
  - `https://0e7c4edf.hongyishi-monorepo.pages.dev/heat-stroke/pages/about` returned HTTP `200` with the Next project shell; first full preview audit saw transient FMS `404` responses during propagation, and rerun passed: internal `37/37`, representative `19/19`, mobile nav `6/6`, guide surfaces `15/15`
  - `HONGYISHI_AUDIT_BASE_URL=https://hongyishi.cn pnpm audit:links` passed: internal `37/37`, representative `19/19`, mobile nav `6/6`, guide surfaces `15/15`
- Notes:
  - Moved heat-stroke `关于本项目` from standalone static HTML into the Portal Next app at `/heat-stroke/pages/about`, reusing the shared `ProjectChrome` navigation and day/night theme behavior.
  - Deleted the old static About HTML source and repointed remaining heat-stroke source links and service-worker cache entries to `/heat-stroke/pages/about`.
  - Tightened the heat-stroke static debt baseline from `9` to `8` style blocks and updated the migration stage to `next-home-and-about-owned-static-deep-pages-pending`.

## 2026-06-30 - ddf29ef - 静态 HTML 债务审计与旧首页链接收口

- Commit: `ddf29ef528ecd09d1996097da2bbf7a42182308f`
- Branch: `main`
- Production: https://hongyishi.cn/
- Cloudflare deployment: https://d012cf50.hongyishi-monorepo.pages.dev
- Deploy method: `npx wrangler@4.105.0 pages deploy .cloudflare/site --project-name=hongyishi-monorepo --branch=main --commit-dirty=true`
- Verification:
  - `pnpm test:cloudflare` passed: `61/61`
  - `pnpm audit:static-debt` passed: heat-stroke `9` style blocks, `43` style attrs, `0` legacy home links; TCCC `26` style blocks, `25` style attrs, `0` legacy home links
  - `pnpm exec prettier --check package.json README.md docs/adding-project.md packages/config/project-registry.mjs scripts/audit-static-debt.mjs scripts/audit-static-debt.test.mjs scripts/project-registry.test.mjs scripts/build-cloudflare.test.mjs` passed
  - `pnpm build:cloudflare` passed
  - `pnpm size:budget` passed: `398 files, 51.51 MiB total`
  - Cloudflare output old project-home link scan passed: `0` matches for `../index.html` or direct `index.html` home links under heat-stroke/TCCC HTML output
  - `HONGYISHI_AUDIT_BASE_URL=http://127.0.0.1:3021 pnpm audit:links` against local Pages preview passed: internal `37/37`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - `HONGYISHI_AUDIT_BASE_URL=https://d012cf50.hongyishi-monorepo.pages.dev pnpm audit:links` passed: internal `37/37`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - `HONGYISHI_AUDIT_BASE_URL=https://hongyishi.cn pnpm audit:links` passed: internal `37/37`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
- Notes:
  - Added `scripts/audit-static-debt.mjs` and its tests to make remaining static HTML `<style>` blocks, inline `style=` attributes, and old project-home links explicit and non-growing.
  - Clarified migration stages in the shared project registry: heat-stroke and TCCC have Next-owned home routes with static deep pages still pending; FMS remains a Vite-owned app deferred from full Next migration.
  - Repointed heat-stroke static page home links from legacy relative `index.html` paths to canonical `/heat-stroke/`, without changing professional medical text or interactive tool contracts.

## 2026-06-30 - deed28b - Next 项目导航配置查缺补漏

- Commit: `deed28b3d9c50df3977f4e6ebad6d30d7564b9d8`
- Branch: `main`
- Production: https://hongyishi.cn/
- Cloudflare deployment: https://e54fd3f3.hongyishi-monorepo.pages.dev
- Deploy method: `npx wrangler@4.105.0 pages deploy .cloudflare/site --project-name=hongyishi-monorepo --branch=main --commit-dirty=true`
- Verification:
  - `pnpm exec prettier --check README.md apps/portal/src/types/hongyishi-config.d.ts apps/portal/src/app/_components/project/projectNav.ts apps/portal/src/app/heat-stroke/page.tsx apps/portal/src/app/tccc/page.tsx` passed after formatting README
  - `pnpm --filter @hongyishi/portal type-check` passed
  - `pnpm exec node --test scripts/project-registry.test.mjs scripts/build-cloudflare.test.mjs` passed: `43/43`
  - `pnpm test:cloudflare` passed: `58/58`
  - `pnpm build:cloudflare` passed
  - `pnpm size:budget` passed: `398 files, 51.51 MiB total`
  - `HONGYISHI_AUDIT_BASE_URL=http://127.0.0.1:3021 pnpm audit:links` against local Pages preview passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - Playwright smoke passed on `/heat-stroke/` and `/tccc/`: mobile top-menu labels and hrefs matched the shared `@hongyishi/config/app-shell/mobile-nav` config, bottom nav stayed `fixed`, and 390px mobile viewport had no horizontal overflow
  - `https://e54fd3f3.hongyishi-monorepo.pages.dev/heat-stroke/`, `/tccc/`, and production `https://hongyishi.cn/heat-stroke/`, `/tccc/` returned HTTP `200` with expected titles and mobile nav scopes
  - First audit against `https://e54fd3f3.hongyishi-monorepo.pages.dev` saw transient FMS `404` responses during Cloudflare propagation; rerunning `HONGYISHI_AUDIT_BASE_URL=https://e54fd3f3.hongyishi-monorepo.pages.dev pnpm audit:links` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - `HONGYISHI_AUDIT_BASE_URL=https://hongyishi.cn pnpm audit:links` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
- Notes:
  - Removed duplicated heat-stroke and TCCC Next-page mobile navigation arrays and now derives those ProjectChrome items from `@hongyishi/config/app-shell/mobile-nav`.
  - Added a Portal type declaration for the shared mobile-nav config package export so TypeScript can check the Next consumers.
  - Updated README to reflect the current runtime ownership: heat-stroke and TCCC have Next-owned home routes with static deep pages and PWA assets preserved.

## 2026-06-30 - 7ac436c - TCCC 首页 Next 接管

- Commit: `7ac436ca9c57883e0daa5777d82653d17f70ff38`
- Branch: `main`
- Production: https://hongyishi.cn/
- Cloudflare deployment: https://6bdaa0b8.hongyishi-monorepo.pages.dev
- Deploy method: `npx wrangler@4.105.0 pages deploy .cloudflare/site --project-name=hongyishi-monorepo --branch=main --commit-dirty=true`
- Verification:
  - Red-green check: `pnpm exec node --test scripts/project-registry.test.mjs` first failed because TCCC was still `routeOwner: "cloudflare-build"`; after implementation it passed: `9/9`
  - Red-green check: `pnpm exec node --test scripts/build-cloudflare.test.mjs` first failed because Next-owned TCCC mode still copied `index.html`; after implementation it passed: `34/34`
  - `pnpm --filter @hongyishi/portal type-check` passed
  - `pnpm test:cloudflare` passed: `58/58`
  - `pnpm build:cloudflare` passed
  - `.cloudflare/site/tccc/index.html`, `.cloudflare/site/tccc/pages/tccc-standard.html`, `.cloudflare/site/tccc/pwa-register.js`, and `.cloudflare/site/tccc/assets/css/tailwind.css` exist in the production bundle
  - `HONGYISHI_AUDIT_BASE_URL=http://127.0.0.1:3021 pnpm audit:links` against local Pages preview passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - `pnpm size:budget` passed: `398 files, 51.51 MiB total`
  - Playwright smoke passed on `/tccc/`: desktop hamburger hidden, global theme button hidden, no horizontal overflow; mobile menu exposed the expected TCCC links, bottom nav stayed `fixed`, no horizontal overflow, and theme toggle set `html.dark`, `hongyishi-blog-theme`, and `theme` to `dark`
  - `HONGYISHI_AUDIT_BASE_URL=https://6bdaa0b8.hongyishi-monorepo.pages.dev pnpm audit:links` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - `HONGYISHI_AUDIT_BASE_URL=https://hongyishi.cn pnpm audit:links` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - `https://hongyishi.cn/tccc/` returned HTTP `200` with title `战场救护 TCCC | 红医师`
- Notes:
  - TCCC root route is now owned by the Portal Next static export while legacy static child pages, assets, manifest, PWA registration, and service worker remain copied into `/tccc/`.
  - Moved the heat-stroke project chrome into a shared Portal project shell and reused it for TCCC, keeping the same mobile top-menu, theme-toggle, and fixed bottom-nav contracts across static project handoffs.
  - TCCC's professional flow pages remain static and unchanged; this deployment replaces the project entry experience and route ownership first.

## 2026-06-30 - e4019d5 - 热射病首页 Next 接管

- Commit: `e4019d5e9bb877816b7e128d960d23c3eaabec68`
- Branch: `main`
- Production: https://hongyishi.cn/
- Cloudflare deployment: https://dc9d46c3.hongyishi-monorepo.pages.dev
- Deploy method: `npx wrangler@4.105.0 pages deploy .cloudflare/site --project-name=hongyishi-monorepo --branch=main --commit-dirty=true`
- Verification:
  - Red-green check: `pnpm exec node --test scripts/project-registry.test.mjs` first failed because heat-stroke was still `routeOwner: "cloudflare-build"`; after implementation it passed: `9/9`
  - `pnpm exec prettier --check apps/portal/src/app/_components/theme-switcher.tsx apps/portal/src/app/globals.css apps/portal/src/app/heat-stroke/ProjectChrome.tsx apps/portal/src/app/heat-stroke/page.tsx packages/config/project-registry.mjs scripts/project-registry.test.mjs` passed
  - `pnpm --filter @hongyishi/portal type-check` passed
  - `pnpm test:cloudflare` passed: `57/57`
  - `pnpm build:cloudflare` passed
  - `.cloudflare/site/heat-stroke/index.html`, `.cloudflare/site/heat-stroke/pages/heat-index.html`, and `.cloudflare/site/heat-stroke/assets/css/tailwind.css` exist in the production bundle
  - `HONGYISHI_AUDIT_BASE_URL=http://127.0.0.1:3021 pnpm audit:links` against local Pages preview passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - `pnpm size:budget` passed: `395 files, 51.41 MiB total`
  - Playwright smoke passed on `/heat-stroke/`: desktop hamburger hidden, global theme button hidden, no horizontal overflow; mobile theme toggled `html.dark`, `hongyishi-blog-theme`, and `theme` to `dark`, bottom nav stayed `fixed`, top menu stayed `static`, no horizontal overflow
  - `HONGYISHI_AUDIT_BASE_URL=https://dc9d46c3.hongyishi-monorepo.pages.dev pnpm audit:links` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - `HONGYISHI_AUDIT_BASE_URL=https://hongyishi.cn pnpm audit:links` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - `https://hongyishi.cn/heat-stroke/` returned HTTP `200` with title `热射病防治 | 红医师`
- Notes:
  - Heat stroke root route is now owned by the Portal Next static export while legacy static child pages, assets, manifest, and service worker remain copied into `/heat-stroke/`.
  - Added a project-specific React app shell for heat-stroke with the same mobile top-menu contract, fixed four-tab bottom nav, and shared day/night theme storage used by the existing static project shell.
  - Added Portal global theme variables so token-based colors render consistently in both light and dark modes instead of only changing the outer app shell.

## 2026-06-30 - a17b23a - Next 项目入口静态导出适配

- Commit: `a17b23a531adf25e25951cdfafcec10771b83273`
- Branch: `main`
- Production: https://hongyishi.cn/
- Cloudflare deployment: https://7d064e4c.hongyishi-monorepo.pages.dev
- Deploy method: `npx wrangler@4.105.0 pages deploy .cloudflare/site --project-name=hongyishi-monorepo --branch=main --commit-dirty=true`
- Verification:
  - Red-green check: `node --test scripts/build-cloudflare.test.mjs` first failed because `materializeNextOwnedProjectEntry` did not exist; after implementation it passed: `33/33`
  - `pnpm exec prettier --check scripts/build-cloudflare.mjs scripts/build-cloudflare.test.mjs` passed
  - `pnpm test:cloudflare` passed: `57/57`
  - `pnpm build:cloudflare` passed
  - `.cloudflare/site/heat-stroke/index.html` and `.cloudflare/site/heat-stroke/pages/heat-index.html` exist under the current `cloudflare-build` route owner
  - `HONGYISHI_AUDIT_BASE_URL=http://127.0.0.1:3021 pnpm audit:links` against local Pages preview passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - `pnpm size:budget` passed: `392 files, 51.34 MiB total`
  - `HONGYISHI_AUDIT_BASE_URL=https://7d064e4c.hongyishi-monorepo.pages.dev pnpm audit:links` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - `HONGYISHI_AUDIT_BASE_URL=https://hongyishi.cn pnpm audit:links` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
- Notes:
  - Added `materializeNextOwnedProjectEntry` so a future Next static export such as `heat-stroke.html` can be materialized as `/heat-stroke/index.html` for the canonical slash route.
  - The adapter is gated by `routeOwner: "next"` and is inert under the current `cloudflare-build` ownership, so this deployment does not change the visible heat-stroke route.

## 2026-06-30 - 72a7358 - 热射病 Next 接管构建准备

- Commit: `72a7358e7a518fa1f42ae6916107fe76c04a67f2`
- Branch: `main`
- Production: https://hongyishi.cn/
- Cloudflare deployment: https://717c9e68.hongyishi-monorepo.pages.dev
- Deploy method: `npx wrangler@4.105.0 pages deploy .cloudflare/site --project-name=hongyishi-monorepo --branch=main --commit-dirty=true`
- Verification:
  - Red-green check: `node --test scripts/build-cloudflare.test.mjs` first failed because Next-owned heat-stroke mode still copied `index.html`; after implementation it passed: `32/32`
  - `pnpm exec prettier --check scripts/build-cloudflare.mjs scripts/build-cloudflare.test.mjs` passed
  - `pnpm test:cloudflare` passed: `56/56`
  - `pnpm build:cloudflare` passed
  - `.cloudflare/site/heat-stroke/index.html` and `.cloudflare/site/heat-stroke/pages/heat-index.html` exist under the current `cloudflare-build` route owner
  - `HONGYISHI_AUDIT_BASE_URL=http://127.0.0.1:3021 pnpm audit:links` against local Pages preview passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - `pnpm size:budget` passed: `392 files, 51.34 MiB total`
  - `HONGYISHI_AUDIT_BASE_URL=https://717c9e68.hongyishi-monorepo.pages.dev pnpm audit:links` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
  - `HONGYISHI_AUDIT_BASE_URL=https://hongyishi.cn pnpm audit:links` passed: internal `38/38`, representative `18/18`, mobile nav `6/6`, guide surfaces `15/15`
- Notes:
  - `copyHeatStrokeApp` is now route-owner-aware: when heat-stroke is later switched to `routeOwner: "next"`, the static copy step can preserve the Next-owned project entry instead of overwriting it with the legacy static `index.html`.
  - Static heat-stroke child pages, assets, manifest, and service worker remain copyable in Next-owned mode, so the future migration can keep existing tools and deep links while replacing the entry route first.
  - This deployment keeps the current `cloudflare-build` owner, so user-facing heat-stroke pages and business logic remain unchanged.

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
