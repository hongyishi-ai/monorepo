# 红医师设计规范

本文件是 `hongyishi.cn` 的长期设计契约。新增页面、重构 UI、迁移静态页到 Next/React 前，必须先阅读本文件，并优先复用现有组件、品牌 token 和构建脚本。

当前视觉方向：**医疗指挥台 + 新构成主义战地海报**。核心气质是巨型中文块字、米白纸底、战地深蓝、暗红信号、粗边框、硬阴影、清晰流程和可信医疗工具感。

## 1. 设计源

不要在页面里临时发明品牌值。优先使用这些文件：

- `packages/config/brand/tokens.json`: 品牌色、圆角、字体 token 的源头。
- `packages/config/tailwind/index.cjs`: 所有 Tailwind 项目的共享 preset。
- `apps/portal/src/app/globals.css`: Portal 和 Next 接管页的语义色变量。
- `apps/portal/src/app/_components/project/ProjectChrome.tsx`: 子项目顶部栏、汉堡菜单、日夜切换、移动底栏的标准实现。
- `packages/config/app-shell/mobile-nav.mjs`: 子项目移动端导航配置。

## 2. 配色

### 2.1 品牌色值

| 用途                       | 名称     | HEX       | Tailwind / CSS token                               |
| -------------------------- | -------- | --------- | -------------------------------------------------- |
| 主色、品牌、危险、重点入口 | 主信号红 | `#D93025` | `hongyishi.red`, `--hys-color-constructivism-red`  |
| 强警示、海报背景           | 战地暗红 | `#A51F18` | `hongyishi.field-red`, `--hys-color-field-red`     |
| 热风险、下一步动作         | 行动橙   | `#FF6B00` | `hongyishi.orange`, `--hys-color-signal-orange`    |
| 工具状态、诊断反馈         | 技术蓝   | `#007AFF` | `hongyishi.blue`, `--hys-color-technology-blue`    |
| 冷却、生命体征、辅助状态   | 临床浅蓝 | `#78C7E7` | `hongyishi.cyan`, `--hys-color-clinical-cyan`      |
| 深色信息面、导航激活态     | 战地深蓝 | `#12313C` | `hongyishi.navy`, `--hys-color-field-navy`         |
| 编号、结构高亮             | 结构黄   | `#FFD700` | `hongyishi.yellow`, `--hys-color-structure-yellow` |
| 强文字、粗边框             | 墨黑     | `#000000` | `hongyishi.ink`, `--hys-color-ink`                 |
| 阅读底色                   | 纸白     | `#FFFFFF` | `hongyishi.paper`, `--hys-color-paper`             |
| 平台背景、海报纸底         | 米白纸底 | `#F4ECDC` | `hongyishi.aged-paper`, `--hys-color-aged-paper`   |
| 次级说明                   | 中性灰   | `#737373` | `hongyishi.muted`, `--hys-color-muted`             |

### 2.2 Portal 语义色

Portal 和 Next 接管页使用 `hsl(var(--token))`，不要直接复制 HSL 数值。

日间：

- `background`: `hsl(38 47% 91%)`，接近 `#F4ECDC`
- `foreground`: `hsl(195 54% 15%)`，接近 `#12313C`
- `card`: `hsl(39 100% 96%)`，暖白卡片
- `primary`: `hsl(4 70% 50%)`，接近 `#D93025`
- `accent`: `hsl(198 65% 69%)`，接近 `#78C7E7`
- `border`: `hsl(195 33% 24%)`
- `muted-foreground`: `hsl(195 18% 35%)`

夜间：

- `background`: `hsl(0 0% 3%)`
- `foreground`: `hsl(38 47% 91%)`
- `card`: `hsl(195 54% 10%)`
- `primary`: `hsl(4 70% 50%)`
- `accent`: `hsl(198 65% 69%)`
- `border`: `hsl(38 18% 35%)`
- `muted-foreground`: `hsl(38 18% 70%)`

### 2.3 禁止事项

- 不使用大面积紫蓝渐变、玻璃拟态、漂浮光斑作为默认风格。
- 医疗关键信息不得使用低对比灰字。
- 不用颜色作为唯一风险提示，必须配合文字、边框或状态标签。

## 3. 字体与排版

### 3.1 字体家族

- 中文正文：`Noto Sans SC`, `Noto Sans CJK SC`, `system-ui`, `sans-serif`
- 英文、编号、状态、版本：`Roboto Mono`, `ui-monospace`, `SFMono-Regular`, `monospace`
- 展示字：`Bebas Neue`, `Impact`, `sans-serif`

展示字只用于品牌、首屏、强标题和编号，不进入正文段落。

### 3.2 字号、字重、行高

| 场景             | 移动端                       | 桌面端                     | 字重        | 行高        |
| ---------------- | ---------------------------- | -------------------------- | ----------- | ----------- |
| 项目顶部品牌     | `clamp(1rem, 5.2vw, 1.8rem)` | 同移动端上限               | `900`       | `1`         |
| 子项目首屏巨标题 | `clamp(2.35rem, 12vw, 4rem)` | `clamp(4rem, 8vw, 6.8rem)` | `900`       | `0.9`       |
| 普通页面 H1      | `3rem` / `text-5xl`          | `4.5rem` / `md:text-7xl`   | `900`       | `1`         |
| 区块标题 H2      | `1.5rem`-`1.875rem`          | `1.875rem`-`3rem`          | `900`       | `1.1`-`1.2` |
| 卡片标题 H3      | `1.25rem`-`1.5rem`           | `1.5rem`                   | `900`       | `1.2`       |
| 正文             | `1rem`                       | `1rem`-`1.125rem`          | `700` 为主  | `1.75`-`2`  |
| 说明、标签       | `0.75rem`-`0.875rem`         | 同移动端                   | `700`-`900` | `1.4`-`1.6` |
| 移动底栏文字     | `13px`                       | 不显示                     | `900`       | `1.15`      |

规则：

- 标题短、硬、可扫描；正文清楚，不文学化。
- 不用负字距；`letter-spacing` 保持 `0`。
- 移动端不要用无限随视口放大的字号，必须有上限。
- 中英文混排、长医学词、表格内容必须允许换行或在局部容器内滚动。

## 4. 间距与布局

### 4.1 页面容器

标准内容容器：

```tsx
className = "mx-auto w-[min(1200px,calc(100%_-_32px))]";
```

含义：

- 最大宽度：`1200px`
- 移动端左右安全边距：`16px`
- 容器内复杂 grid 必须加 `grid-cols-1` 作为移动端默认列。
- grid item、卡片、图表、表单面板必须能收缩，必要时加 `min-w-0`。

### 4.2 常用间距

| 用途                      | Tailwind                                           | 像素                  |
| ------------------------- | -------------------------------------------------- | --------------------- |
| 控件内部横向 padding      | `px-3` / `px-4` / `px-5`                           | `12 / 16 / 20px`      |
| 卡片 padding              | `p-5`                                              | `20px`                |
| 大卡片 / 复杂工具 padding | `p-6` / `md:p-10`                                  | `24 / 40px`           |
| 组件内小间距              | `gap-2` / `gap-3`                                  | `8 / 12px`            |
| 卡片组间距                | `gap-4` / `gap-5` / `gap-6`                        | `16 / 20 / 24px`      |
| 区块上下间距              | `py-10` / `py-12` / `py-14` / `py-16`              | `40 / 48 / 56 / 64px` |
| 首屏桌面上下间距          | `md:py-20`                                         | `80px`                |
| 移动底栏安全底距          | `pb-[calc(env(safe-area-inset-bottom)_+_0.5rem)]`  | 安全区 + `8px`        |
| 页面为移动底栏留白        | `pb-[calc(env(safe-area-inset-bottom)_+_5.75rem)]` | 安全区 + `92px`       |

### 4.3 响应式规则

- 移动端默认单列：`grid grid-cols-1`。
- 中屏以上再启用多列：`md:grid-cols-*`、`lg:grid-cols-*`。
- 复杂内容不得导致页面级横向滚动；宽表格允许在卡片内部 `overflow-x-auto`。
- 移动端触控目标不小于 `44px`，主要按钮建议 `min-h-12`，菜单按钮 `min-h-14 min-w-14`。

## 5. 组件样式

### 5.1 按钮

主按钮：

- 高度：`min-h-12`，重要移动按钮可用 `min-h-14`
- 边框：`border-2`
- 圆角：`rounded` 或 `rounded-[var(--hys-radius-control)]`，默认 `4px`-`6px`
- 字重：`font-black`
- 主色：`bg-primary text-primary-foreground`
- 强按钮可用 `bg-foreground text-background`
- 按压反馈：`active:translate-x-1 active:translate-y-1` 或 `active:translate-y-px`

次按钮：

- `border-2 border-border bg-card text-card-foreground`
- hover 可用 `hover:bg-accent hover:text-accent-foreground`

危险 / 医疗警示：

- 使用 `destructive` 或 `primary` 红色系。
- 必须写清楚动作和风险，不能只放图标。

### 5.2 卡片

标准卡片：

```tsx
className =
  "min-w-0 rounded border-2 border-border bg-card p-5 text-card-foreground shadow-[6px_6px_0_rgba(18,49,60,0.14)]";
```

夜间阴影：

```tsx
dark:shadow-[6px_6px_0_rgba(217,48,37,0.18)]
```

规则：

- 默认圆角不超过 `8px`。
- 不做卡片套卡片；页面大分区用完整色块或无框布局。
- 卡片内若有宽表格、SVG 图表、横向控件，卡片本体必须 `min-w-0`。
- 卡片标题用 `font-black text-primary`，正文用 `font-bold leading-7/8 text-muted-foreground`。

### 5.3 导航栏

项目顶部栏使用 `ProjectChrome`，不要重写：

- header: `fixed inset-x-0 top-0 z-50 border-b-2 border-border bg-background/95`
- 固定顶栏由 `ProjectChrome` 自带响应式占位：移动端 `84px`，桌面端 `80px`；页面不得自行补 `padding-top`
- 容器：`min-h-[78px] w-[min(1200px,calc(100%_-_32px))]`
- 品牌字：`font-black leading-none`
- 日夜切换按钮：`min-h-11 min-w-11`，默认无可见边框
- 汉堡按钮：`min-h-11 min-w-11 border-2 border-transparent bg-transparent text-foreground`；关闭时不显示方框，仅展开时反转为深色
- 移动菜单项：`min-h-[58px] px-4 py-4 text-lg font-black`

移动底栏使用 `ProjectChrome` 的 bottom nav：

- 固定底部：`fixed inset-x-0 bottom-0`
- 栅格：`grid grid-cols-4`
- 高度：每项 `min-h-[54px]`
- 边框：顶部 `border-t-2 border-foreground`
- 激活态：`border-foreground bg-foreground text-background`
- 非激活态：`border-transparent text-muted-foreground`

### 5.4 表单、表格、图表

表单：

- 输入框：`min-h-12 border-2 border-border bg-background px-3 text-base font-bold`
- 输入框在 grid 中必须允许收缩：`min-w-0`
- 错误反馈必须贴近字段或结果区，并说明如何修正。

表格：

- 宽表格用局部滚动：外层 `max-w-full overflow-x-auto`。
- 表格可以设置 `min-w-[620px]` / `min-w-[640px]`，但不得撑开页面。

图表：

- SVG / canvas 外层必须 `min-w-0 overflow-hidden` 或 `overflow-x-auto`。
- 图例、轴标签不得替代文字解释。

## 6. 日夜模式

日夜切换必须改变整个页面配色，而不是只改变 app shell。

规则：

- 使用 `html.dark` / `.dark` class。
- 新页面必须用 `bg-background text-foreground`、`bg-card text-card-foreground`、`text-muted-foreground` 等语义 token。
- 不要在大面积区域硬编码只适合日间的颜色。
- 如果必须硬编码品牌 HEX，必须同时给出 `dark:` 对应状态。

## 7. 新页面执行规则

新增页面或重构 UI 前：

1. 先读本文件。
2. 找最近的同类页面或组件复用，例如 `ProjectChrome`、移动导航配置、热射病 Next 接管页的 `Card`/`DataTable` 模式。
3. 优先使用 `packages/config/brand/tokens.json` 和 `@hongyishi/config/tailwind`。
4. 不复制一整套孤立 CSS，不重新实现日夜切换、汉堡菜单、移动底栏。
5. 不改专业医学文字和业务逻辑，除非用户明确要求。
6. 移动端至少考虑 `320px`、`375px`、`390px`。

## 8. 验证与 token 节省规则

小修改不做大范围审计。按风险选择验证范围：

- 文档-only：检查相关文档引用，通常不跑构建、不部署。
- 单页面样式：跑该页面相关类型检查或构建；必要时用 Playwright 看目标页面和目标视口。
- 路由、构建脚本、共享组件、导航、主题：跑 `pnpm test:cloudflare`、`pnpm build:cloudflare`、相关审计。
- 部署改动：部署后必须记录 `docs/deployment-log.md`，并验证 preview 与 production。

节省 token 的实践：

- 先用 `rg` 精准找文件，不做无目的全仓库读取。
- 优先读 token、共享组件、目标页面，避免每次小改都展开完整审计日志。
- 使用脚本输出摘要；不要把巨大 DOM、长日志、整页 HTML 原样灌进上下文。
- 能用截图判断视觉问题时，用少量截图替代大量文字 dump。
- 重复问题优先沉淀脚本或规范，例如 `pnpm audit:mobile-width`。
- 如果 token 消耗主要来自长日志、Actions 等待、全站审计或重复读取文件，执行者应主动提醒用户并收窄范围。

## 9. 当前项目统一原则

红医师统一的是产品平台、品牌系统、部署入口和质量门禁，不要求所有项目一次性迁移到同一框架。

- Portal: Next 静态导出，负责首页、内容、SEO、项目注册和统一入口。
- FMS: Vite + React SPA，负责本地数据、评估流程、PWA、图表和复杂交互。
- 热射病: 深层页逐步由 Portal Next 接管，统一 `ProjectChrome`、移动导航、日夜主题和内容治理。
- TCCC: 保留静态内容资产，逐步接入统一 shell 和 Next 接管策略。

新增复杂交互时优先复用现有 React/Next 模式；资料型页面可以继续静态化，但必须遵守本设计规范。
