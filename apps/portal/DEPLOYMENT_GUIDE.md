# 部署指南

## 项目概述

本项目是一个融合了作品集展示和博客内容的 Next.js 15 应用：
- `/` - 作品集首页（新构成主义风格）
- `/blog` - 博客列表页（编辑式极简风格）
- `/blog/posts/[slug]` - 文章详情页

## 技术栈

- **框架**: Next.js 15.0.2
- **React**: 19.0.0-rc
- **样式**: Tailwind CSS 3.4.4
- **语言**: TypeScript 5.5.2
- **字体**: Inter, Bebas Neue, Roboto Mono
- **图片**: Unsplash CDN (可迁移到本地)

## 本地开发

### 1. 安装依赖

```bash
cd /Users/zhangwenzhao/Downloads/blog
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问：
- 作品集：http://localhost:3000
- 博客：http://localhost:3000/blog

### 3. 构建生产版本

```bash
npm run build
```

### 4. 启动生产服务器

```bash
npm start
```

## 部署到 Cloudflare Pages

### 方式一：通过 Git 集成（推荐）

1. **推送代码到 Git 仓库**

```bash
git add .
git commit -m "Portfolio and blog integration completed"
git push origin main
```

2. **在 Cloudflare Pages 控制台配置**

- 登录 Cloudflare Dashboard
- Pages → Create a project → Connect to Git
- 选择你的仓库
- 配置构建设置：

```
Framework preset: Next.js
Build command: npm run build
Build output directory: .next
Root directory: (留空或指定具体目录)
Environment variables: (如需要添加)
```

3. **部署完成后访问**

- Cloudflare 会自动分配一个 `*.pages.dev` 域名
- 配置自定义域名: `hongyishi.cn`

### 方式二：使用 Cloudflare CLI

1. **安装 Wrangler CLI**

```bash
npm install -g wrangler
```

2. **登录 Cloudflare**

```bash
wrangler login
```

3. **构建项目**

```bash
npm run build
```

4. **部署**

```bash
npx wrangler pages deploy .next --project-name=hongyishi
```

### 方式三：手动上传

1. **构建静态文件**

```bash
npm run build
```

2. **在 Cloudflare Pages 控制台**

- Pages → Create a project → Upload assets
- 上传 `.next` 目录

## 域名配置

### 主域名配置

**目标**: `hongyishi.cn` → 作品集首页

1. 在 Cloudflare Pages 项目设置中
2. Custom domains → Add a custom domain
3. 输入 `hongyishi.cn`
4. 按照指引配置 DNS 记录

### 子域名配置（可选）

如果希望保持 `blog.hongyishi.cn` 独立：

1. 添加 CNAME 记录指向 Pages 项目
2. 或者使用 Cloudflare Workers 进行路由重写

## 环境变量

当前项目不需要环境变量。如果未来需要，在 Cloudflare Pages 项目设置中添加：

```
Settings → Environment variables
```

## SEO 配置

### sitemap.xml

已创建静态 `public/sitemap.xml`，包含所有页面。

访问：`https://hongyishi.cn/sitemap.xml`

### robots.txt

已创建 `public/robots.txt`，允许所有搜索引擎抓取。

访问：`https://hongyishi.cn/robots.txt`

### Google Search Console

1. 访问 https://search.google.com/search-console
2. 添加资源：`hongyishi.cn`
3. 验证所有权（DNS 验证或文件验证）
4. 提交 sitemap：`https://hongyishi.cn/sitemap.xml`

## 性能优化

### 图片优化

**当前状态**: 使用 Unsplash CDN

**优化建议**:
1. 下载图片到 `public/assets/portfolio/covers/`
2. 使用 WebP 格式
3. 建议尺寸：1200x800px
4. 质量：80-85%

**替换步骤**:

1. 下载图片（参考 `public/assets/portfolio/covers/README.md`）
2. 修改 `src/app/_components/portfolio/PortfolioGrid.tsx`：

```typescript
// 从
coverImage: 'https://images.unsplash.com/...'
// 改为
coverImage: '/assets/portfolio/covers/reshebing.webp'
```

### Lighthouse 测试

部署后运行 Lighthouse 测试：

```bash
# Chrome DevTools
1. 打开开发者工具
2. Lighthouse 标签
3. 生成报告

# 或使用 CLI
npm install -g lighthouse
lighthouse https://hongyishi.cn --view
```

**目标分数**:
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 95

## 监控和分析

### Cloudflare Web Analytics（免费）

1. Cloudflare Dashboard → Web Analytics
2. 为 `hongyishi.cn` 启用
3. 添加跟踪脚本到 `src/app/layout.tsx`

### Google Analytics（可选）

```typescript
// src/app/layout.tsx
<Script
  src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
  strategy="afterInteractive"
/>
<Script id="google-analytics" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
  `}
</Script>
```

## 更新和维护

### 添加新博客文章

1. 在 `_posts/` 目录创建新的 `.md` 文件
2. 添加 Front Matter：

```markdown
---
title: "文章标题"
excerpt: "文章摘要"
coverImage: "/assets/blog/your-post/cover.jpg"
date: "2025-10-09T00:00:00.000Z"
author:
  name: 红医师
  picture: "/assets/blog/authors/hongyishi.jpeg"
ogImage:
  url: "/assets/blog/your-post/cover.jpg"
---

文章内容...
```

3. 重新构建和部署

### 更新作品集项目

修改 `src/app/_components/portfolio/PortfolioGrid.tsx` 中的 `projects` 数组。

### 更新 sitemap.xml

添加新文章时，手动更新 `public/sitemap.xml`：

```xml
<url>
  <loc>https://hongyishi.cn/blog/posts/new-post-slug</loc>
  <lastmod>2025-10-09</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
```

## 故障排查

### 问题 1: 构建失败

**检查**:
```bash
npm run build
```

**常见原因**:
- TypeScript 类型错误
- 缺少依赖
- 图片路径错误

### 问题 2: 页面 404

**检查**:
- 路由配置是否正确
- 文件命名是否符合 Next.js 约定
- `_posts` 目录是否存在

### 问题 3: 样式不生效

**检查**:
- Tailwind CSS 配置
- CSS 模块导入
- 类名拼写

### 问题 4: 图片加载失败

**检查**:
- `next.config.js` 中的 `remotePatterns` 配置
- 图片路径是否正确
- Unsplash URL 是否可访问

## 备份和回滚

### 备份代码

```bash
git tag v2.0-portfolio-integration
git push origin v2.0-portfolio-integration
```

### 回滚部署

在 Cloudflare Pages 控制台：
1. Deployments 标签
2. 找到之前的成功部署
3. 点击 "Rollback to this deployment"

## 安全建议

1. **定期更新依赖**

```bash
npm update
npm audit fix
```

2. **环境变量保护**

- 不要在代码中硬编码敏感信息
- 使用 Cloudflare Pages 的环境变量功能

3. **HTTPS**

Cloudflare Pages 自动提供 HTTPS，无需额外配置。

4. **CSP（内容安全策略）**

在 `next.config.js` 中配置：

```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
]
```

## 联系和支持

**开发者**: 红医师
**邮箱**: nimrod1990@163.com
**网站**: https://hongyishi.cn

## 版本历史

- **v2.0** (2025-10-09) - 作品集与博客融合
  - 新构成主义风格作品集首页
  - 完整的导航系统
  - SEO 优化
  - 深色模式支持

- **v1.0** - Next.js 博客初版
  - 编辑式极简设计
  - Markdown 文章支持
  - 思源黑体字体

---

**部署状态：✅ 生产就绪！**

