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
