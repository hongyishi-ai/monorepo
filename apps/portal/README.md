# 红医师 - 作品与思考

红医师是一个医疗软件与资源共享项目，本站整合了作品集展示与博客内容。

## 项目链接

- 作品集首页（本站）：`https://hongyishi.cn`
- 博客文章：`https://hongyishi.cn/blog`
- 训练伤防治：`https://fms.hongyishi.cn`
- 辅助诊断：`https://clinic.hongyishi.cn`
- 热射病防治：`https://reshebing.hongyishi.cn`
- 移动药房：`https://yf.hongyishi.cn`
- 播客：`https://www.xiaoyuzhoufm.com/podcast/6818ac762ad01a51a25ce2c9`

## 技术栈

本站使用 Next.js 15 + React 19 + Tailwind CSS + TypeScript 构建。

- **作品集首页** (`/`) - 新构成主义风格设计
- **博客** (`/blog`) - 编辑式极简风格
- **文章渲染** - Markdown + remark + remark-html

文章位于 `/_posts`，配图位于 `public/assets/blog/<slug>/`。

## 项目架构

### 路由结构

- `/` - 作品集首页（新构成主义风格）
- `/blog` - 博客列表页
- `/blog/posts/[slug]` - 文章详情页

### 设计风格

**作品集首页** - 新构成主义 (Constructivism)
- 字体：Bebas Neue (标题) + Roboto Mono (代码)
- 配色：工业红 (#D93025)、科技蓝 (#007AFF)、结构黄 (#FFD700)
- 特点：粗边框、硬阴影、几何装饰、强烈对比
- 布局：遵循严格的网格系统，采用非对称布局创造视觉张力

**博客页面** - 编辑式极简
- 字体：思源黑体 (Noto Sans SC)
- 配色：中性色调
- 特点：留白、简洁排版、易读性

### 统一的排版系统

为确保整站视觉一致性，作品集页面与博客页面遵循相同的排版规范：

**容器系统**
- 最大宽度：`max-w-7xl mx-auto`（所有主要区块）
- 水平边距：`px-6 md:px-8`（移动端 24px，桌面端 32px）
- 垂直间距：`py-16 md:py-20`（section 级别）

**网格系统**
- 博客：2 列网格 `md:grid-cols-2`，间距 `gap-x-16 lg:gap-x-32`
- 作品集：3 列网格 `md:grid-cols-3`，间距 `gap-6 md:gap-8`
- 统计卡片：3 列网格 `md:grid-cols-3`，间距 `gap-6`

**设计理念**
- 严格的网格系统：所有元素遵循居中容器约束，左右边距统一对齐
- 非对称布局：内容左对齐，利用网格错落分布创造动感
- 响应式设计：移动端单列布局，桌面端多列网格

### 组件架构

**作品集组件** (`src/app/_components/portfolio/`)
- `PortfolioHero.tsx` - 页眉区域
- `PortfolioCard.tsx` - 项目卡片
- `PortfolioGrid.tsx` - 网格布局
- `AboutSection.tsx` - 关于区域
- `PortfolioFooter.tsx` - 页脚

**博客组件** (`src/app/blog/_components/`)
- `PortfolioLinks.tsx` - 新构成主义风格的项目链接卡片

## Visual design language

All UI enhancements must comply with the shared visual principles captured in [`AGENTS.md`](./AGENTS.md). Refer to that document before introducing new components or modifying existing ones to keep typography, spacing, colour usage, and interaction patterns consistent.

### 字体（Font）

- 全站使用思源黑体 Noto Sans SC（通过 `next/font/google` 加载）。
- 已在 `src/app/layout.tsx` 全局应用；SVG 与脚本内嵌字体已同步更新为 `'Noto Sans SC'` 回退 `'Noto Sans CJK SC', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif`。

### 主题切换（Theme Switcher）

- **全局主题切换**：右上角固定显示的圆形主题切换按钮，采用极简博客风格
- **三种模式**：系统自动 / 日间模式 / 夜间模式
- **设计特点**：
  - 圆形按钮（28px）、1px 细边框、毛玻璃效果
  - 半透明背景 + 6px 背景模糊
  - 图标采用细线条（stroke-width: 2）、圆形端点
  - 与"了解更多"按钮并列显示，避免重叠

### 深色模式（Dark Mode）

**作品集页面日间/夜间模式设计**：
- **日间模式（Light）**：
  - 背景：白色 (#fff)
  - 文字：黑色 (#000)
  - 品牌色：构成主义红 (#D93025)
  - 统计卡片：浅灰背景 (#f5f5f5)
- **夜间模式（Dark）**：
  - 背景：纯黑 (#000)
  - 文字：白色 (#fff)
  - 品牌色：构成主义红（保持一致）
  - 统计卡片：深色背景 (#1a1a1a)
- **设计理念**：日间/夜间模式通过背景和文字颜色的反转实现对比，品牌色保持统一
- **过渡动画**：所有颜色变化添加 300ms 平滑过渡

### 技术规范

**已统一的技术标准**：
- **语言标签**：HTML lang 属性设置为 `zh-CN`
- **边框宽度**：统一使用 `border-3` (3px) 工具类
- **品牌色**：全局统一使用 `constructivism-red` (#D93025)
- **按钮位置**："了解更多"按钮已移至 Footer，与"联系作者"并列显示

## 访问

- 线上地址：`https://blog.hongyishi.cn`
## 相关示例（Next.js 官方例子）

- [AgilityCMS](/examples/cms-agilitycms)
- [Builder.io](/examples/cms-builder-io)
- [ButterCMS](/examples/cms-buttercms)
- [Contentful](/examples/cms-contentful)
- [Cosmic](/examples/cms-cosmic)
- [DatoCMS](/examples/cms-datocms)
- [DotCMS](/examples/cms-dotcms)
- [Drupal](/examples/cms-drupal)
- [Enterspeed](/examples/cms-enterspeed)
- [Ghost](/examples/cms-ghost)
- [GraphCMS](/examples/cms-graphcms)
- [Kontent.ai](/examples/cms-kontent-ai)
- [MakeSwift](/examples/cms-makeswift)
- [Payload](/examples/cms-payload)
- [Plasmic](/examples/cms-plasmic)
- [Prepr](/examples/cms-prepr)
- [Prismic](/examples/cms-prismic)
- [Sanity](/examples/cms-sanity)
- [Sitecore XM Cloud](/examples/cms-sitecore-xmcloud)
- [Sitefinity](/examples/cms-sitefinity)
- [Storyblok](/examples/cms-storyblok)
- [TakeShape](/examples/cms-takeshape)
- [Tina](/examples/cms-tina)
- [Umbraco](/examples/cms-umbraco)
- [Umbraco heartcore](/examples/cms-umbraco-heartcore)
- [Webiny](/examples/cms-webiny)
- [WordPress](/examples/cms-wordpress)
- [Blog Starter](/examples/blog-starter)

## 本地开发

```bash
npm install
npm run dev
```

打开 `http://localhost:3000` 查看站点。

# Notes

`blog-starter` uses [Tailwind CSS](https://tailwindcss.com) [(v3.0)](https://tailwindcss.com/blog/tailwindcss-v3).

## 在仓库内创建新文章

You can scaffold a post and its assets folder with a single command:

```
npm run new:post -- --slug my-article --title "My Article" --author "Your Name" --authorPic "/assets/blog/authors/zwz.jpeg" --excerpt "One-line summary"
```

This creates:
- `_posts/my-article.md` (with front matter prefilled)
- `public/assets/blog/my-article/cover.jpg` (placeholder)

然后将图片放入 `public/assets/blog/my-article/`，开发或部署后即可访问 `/posts/my-article`。

## 渲染与 Markdown 支持

- 使用 `remark` + `remark-html` 渲染 Markdown。
- 已启用 `remark-gfm`（GitHub Flavored Markdown）：表格、自动链接、删除线、任务清单等将被正确渲染。
- 表格与链接在 `src/app/_components/markdown-styles.module.css` 中做了简洁样式。

## 内容与品牌约定

- 已移除示例文章：`hello-world.md`、`preview.md`。
- 将所有作者头像引用 `authors/jj.jpeg` 统一替换为 `authors/hongyishi.jpeg`（官方发布形象）。
- 个人文章作者头像建议使用：`/assets/blog/authors/zwz.jpeg`。
- “作品集”仅在页脚以极简图标形式展示；首页中部不再展示独立模块。

若要新增“官方发布”文章，Front Matter 示例：

```
author:
  name: 红医师
  picture: "/assets/blog/authors/hongyishi.jpeg"
```

若为个人文章：

```
author:
  name: 你的名字
  picture: "/assets/blog/authors/zwz.jpeg"
```

## 清理与精简（本次改动）

- 移除未使用的示例文章：`hello-world.md`、`preview.md` 及其配套资源文件夹。
- 移除未使用作者头像：`joe.jpeg`、`tim.jpeg`；统一头像到 `hongyishi.jpeg`（官方）与 `zwz.jpeg`（个人）。
- 页脚图标改为 PNG，删除早期 SVG 占位；移除未使用的 `public/assets/portfolio/blog`。
- 忽略并清理仓库中的 `.DS_Store` 等杂项文件。

## 常见开发问题

- 端口占用：开发服务器已热更新，无需每次重启。若端口被占用：
  - 查看：`lsof -i :3000 -sTCP:LISTEN -Pn`
  - 结束：`pkill -f "next dev --turbopack"` 或 `kill <PID>`

## 界面更新（最近）

- 文章详情页：新增右侧“目录 + 分段进度”
  - 自动生成 H2/H3 的目录层级，当前标题随滚动高亮
  - 每条目前有品牌红圆环，显示该小节阅读进度（从标题进入视口底部开始计）
  - 目录列表粘附右侧，内部可滚动，并在长文末尾提前滚入最后条目
  - 文件：`src/app/_components/article-toc.tsx`、`circular-reading-progress.tsx`
- 阅读进度条：保留底部红色进度条（顶部已移除），80ms 线性动画
  - 文件：`src/app/_components/reading-progress.tsx`，接入点：`/blog/posts/[slug]/page.tsx`
- 返回顶部：在移动端文章底部提供简洁的返回顶部控件
  - 文件：`src/app/_components/back-to-top.tsx`
- 主题切换修复：主页主题按钮无法使用的问题已修复
  - 在脚本尚未注入的极端时序下提供本地后备逻辑，确保按钮立即生效
  - 文件：`src/app/_components/theme-switcher.tsx`

### 移动端目录（新增）

- 文章底部迷你栏 + 抽屉目录：
  - 迷你栏显示当前小节标题与品牌红圆环；右侧文字“目录”替换为极简三横线图标
  - 点击打开抽屉，显示完整目录（H2/H3），联动高亮并支持平滑跳转
  - 文件：`src/app/_components/mobile-toc.tsx`

- 统一阴影动效：按钮与作品集卡片在 hover 时采用“下沉→阴影由浅变深”的统一规则。
  - 默认阴影：`8px 8px 0 rgba(0,0,0,0.25)`（暗色：`rgba(255,255,255,0.08)`）
  - hover 阴影：`4px 4px 0 rgba(0,0,0,0.6)`（暗色：`rgba(255,255,255,0.25)`）
  - 小屏（≤768px）：默认 `6px 6px 0`，hover `3px 3px 0`，同样遵循“由浅变深”。
  - 实现位置：`src/app/_styles/constructivism.module.css` 的 `.neoButton` 与 `.portfolioCard` 相关规则。
- 颜色策略：hover 阴影不再使用彩色，仅保留边框的主题色（红/蓝/黄/灰），更符合视觉直觉。
- 临时隐藏统计卡片：作品集页的统计卡片网格已临时隐藏，保留代码方便随时恢复。
  - 实现位置：`src/app/_components/portfolio/AboutSection.tsx` 为网格容器添加了 `hidden` 类。

> 参考：如需恢复统计卡片，将 `AboutSection` 中统计网格容器移除 `hidden` 即可；如需调整阴影动画，统一在 `constructivism.module.css` 中修改。
