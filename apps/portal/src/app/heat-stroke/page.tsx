import { platformProjects } from "@/lib/projects";
import { ProjectChrome } from "../_components/project/ProjectChrome";

function getHeatStrokeProject() {
  const entry = platformProjects.find((item) => item.id === "heat-stroke");

  if (!entry) {
    throw new Error("Missing heat-stroke project registry entry");
  }

  return entry;
}

const project = getHeatStrokeProject();

const bottomItems = [
  { id: "heat-index", label: "热指数", href: "/heat-stroke/pages/heat-index" },
  {
    id: "field-treatment",
    label: "处置",
    href: "/heat-stroke/pages/field-treatment",
  },
  { id: "rule", label: "法则", href: "/heat-stroke/pages/8-4-6-rule" },
  { id: "library", label: "资料", href: "/heat-stroke/" },
];

const menuItems = [
  { id: "platform", label: "总入口", href: "/" },
  { id: "library", label: "项目首页", href: "/heat-stroke/" },
  {
    id: "heat-index",
    label: "热指数查询",
    href: "/heat-stroke/pages/heat-index",
  },
  {
    id: "field-treatment",
    label: "现场处置",
    href: "/heat-stroke/pages/field-treatment",
  },
  { id: "rule", label: "8-4-6法则", href: "/heat-stroke/pages/8-4-6-rule" },
  {
    id: "guide",
    label: "诊断与治疗指南",
    href: "/heat-stroke/pages/diagnosis-treatment-guideline",
  },
  {
    id: "consensus",
    label: "救治体系共识",
    href: "/heat-stroke/pages/treatment-system-consensus",
  },
  {
    id: "heat-tolerance",
    label: "热耐力评估",
    href: "/heat-stroke/pages/heat-tolerance",
  },
  {
    id: "cooling",
    label: "核心体温与降温",
    href: "/heat-stroke/pages/core-temperature-cooling",
  },
  { id: "challenge", label: "通关挑战", href: "/heat-stroke/pages/challenge" },
  { id: "about", label: "关于项目", href: "/heat-stroke/pages/about" },
];

const priorityTools = [
  {
    eyebrow: "必学",
    title: "8-4-6 热射病救治黄金法则",
    body: "把核心救治节奏固定下来，先形成处置动作，再进入完整资料。",
    href: "/heat-stroke/pages/8-4-6-rule",
    action: "了解法则",
    marker: "8-4-6",
  },
  {
    eyebrow: "实时热指数查询",
    title: "查指数，知训练舒适度",
    body: "进入热指数查询工具，同时保留热射病防治8项措施清单。",
    href: "/heat-stroke/pages/heat-index",
    action: "立即查询",
    marker: "WBGT",
  },
  {
    eyebrow: "必会",
    title: "模拟热射病现场处置流程",
    body: "从现场识别、快速降温到转运衔接，进入原有处置流程。",
    href: "/heat-stroke/pages/field-treatment",
    action: "模拟流程",
    marker: "现场",
  },
];

const learningResources = [
  {
    title: "热射病防治8项措施清单",
    body: "查举措，降风险",
    href: "/heat-stroke/pages/heat-index#checklist-count",
  },
  {
    title: "热耐力评估",
    body: "测耐力，了解自我",
    href: "/heat-stroke/pages/heat-tolerance",
  },
  {
    title: "热射病通关挑战！你到底掌握了多少？",
    body: "进入挑战，复盘关键知识点。",
    href: "/heat-stroke/pages/challenge",
  },
  {
    title: "热射病核心体温监测与降温方法",
    body: "掌握方法",
    href: "/heat-stroke/pages/core-temperature-cooling",
  },
  {
    title: "速读中国热射病诊断与治疗指南",
    body: "深入学习",
    href: "/heat-stroke/pages/diagnosis-treatment-guideline",
  },
  {
    title: "速读热射病救治体系建设标准专家共识",
    body: "查看共识",
    href: "/heat-stroke/pages/treatment-system-consensus",
  },
];

export const metadata = {
  title: "热射病防治 | 红医师",
  description: project.description,
};

export default function HeatStrokePage() {
  const content = project.content;

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-background pb-[calc(env(safe-area-inset-bottom)_+_5.75rem)] text-foreground md:pb-0"
      data-hongyishi-project-page
    >
      <ProjectChrome
        activeBottomItemId="library"
        activeMenuItemId="library"
        bottomAriaLabel="热射病项目移动端导航"
        bottomItems={bottomItems}
        brandHref="/heat-stroke/"
        menuAriaLabel="热射病项目移动端菜单"
        menuButtonLabel="打开热射病项目移动端导航菜单"
        menuItems={menuItems}
        menuPanelId="hys-mobile-top-menu-panel-heatStroke"
        navAriaLabel="热射病防治导航"
        projectLabel="热射病防治"
        scope="heatStroke"
        titlePrefix="打开热射病"
      />

      <main id="main">
        <section
          aria-labelledby="heat-stroke-title"
          className="relative isolate flex min-h-[calc(100svh_-_78px)] items-end overflow-hidden border-b-2 border-border"
        >
          <img
            alt="热射病防治海报"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
            src={project.coverImage}
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(12,30,36,0.94)_0%,rgba(165,31,24,0.78)_42%,rgba(244,236,220,0.08)_100%)] dark:bg-[linear-gradient(90deg,rgba(0,0,0,0.94)_0%,rgba(65,14,12,0.84)_45%,rgba(0,0,0,0.12)_100%)]" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(244,236,220,0.13)_1px,transparent_1px),linear-gradient(90deg,rgba(244,236,220,0.1)_1px,transparent_1px)] bg-[size:72px_72px]" />

          <div className="mx-auto w-[min(1200px,calc(100%_-_32px))] pb-[calc(env(safe-area-inset-bottom)_+_7rem)] pt-12 text-background dark:text-foreground md:py-20">
            <p className="mb-4 inline-flex items-center gap-3 font-mono text-sm font-black text-background/80 dark:text-foreground/80">
              <span className="h-1 w-10 bg-accent" aria-hidden="true" />
              RE SHE BING FANG ZHI
            </p>
            <h1
              className="max-w-3xl text-[clamp(4rem,12vw,8rem)] font-black leading-[0.88] tracking-normal"
              id="heat-stroke-title"
            >
              <span className="text-[#ff8b3d]">热射病</span>
              <br />
              防治
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-bold leading-8 text-background/85 dark:text-foreground/85 md:text-xl">
              与高温赛跑，守住生命体温。这里保留原有热指数查询、8项预防清单、热耐力评估、现场处置与指南速读。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                className="inline-flex min-h-12 items-center justify-center rounded border-2 border-foreground bg-[#ff8b3d] px-5 font-black text-[#12313c] no-underline shadow-[5px_5px_0_rgba(244,236,220,0.35)] transition-transform active:translate-x-1 active:translate-y-1"
                href="/heat-stroke/pages/heat-index"
              >
                查询热指数
              </a>
              <a
                className="inline-flex min-h-12 items-center justify-center rounded border-2 border-background bg-background/95 px-5 font-black text-[#12313c] no-underline shadow-[5px_5px_0_rgba(18,49,60,0.35)] transition-transform active:translate-x-1 active:translate-y-1 dark:border-foreground dark:bg-foreground dark:text-background"
                href="/heat-stroke/pages/field-treatment"
              >
                进入现场处置
              </a>
            </div>
          </div>
        </section>

        <aside
          aria-label="内容审核状态"
          className="border-b-2 border-border bg-muted/45"
          data-hongyishi-content-governance
        >
          <div className="mx-auto grid w-[min(1200px,calc(100%_-_32px))] gap-2 py-3 font-mono text-xs font-bold leading-5 text-muted-foreground md:grid-cols-[auto_1fr] md:items-center">
            <span className="w-fit border-2 border-primary bg-primary px-2 py-1 font-black text-primary-foreground">
              内容状态：待复核
            </span>
            <span className="text-foreground">
              {project.shortTitle} · {content.disclaimer}
            </span>
            <span className="md:col-span-2">
              来源：{content.sourceName} · 版本：{content.version} · 复核日期：
              {content.reviewedAt}.{" "}
              <a
                className="font-black text-foreground underline underline-offset-4"
                href={content.officialUpdateUrl}
              >
                官方更新源
              </a>
            </span>
          </div>
        </aside>

        <section className="mx-auto w-[min(1200px,calc(100%_-_32px))] py-12 md:py-16">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-sm font-black text-muted-foreground">
                FIRST RESPONSE MATRIX
              </p>
              <h2 className="mt-2 text-4xl font-black leading-none text-primary md:text-5xl">
                应急工具阵列
              </h2>
            </div>
            <p className="max-w-xl font-bold leading-7 text-muted-foreground">
              先判断风险，再准备预防，最后进入处置流程。所有原始学习内容和工具入口继续保留。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {priorityTools.map((item, index) => (
              <a
                className={`group relative overflow-hidden rounded border-2 border-border bg-card p-5 text-card-foreground no-underline shadow-[6px_6px_0_rgba(18,49,60,0.16)] transition-transform hover:-translate-y-1 dark:shadow-[6px_6px_0_rgba(217,48,37,0.24)] ${
                  index === 0 ? "md:col-span-3 lg:col-span-1" : ""
                }`}
                href={item.href}
                key={item.href}
              >
                <span className="font-mono text-xs font-black text-primary">
                  {item.eyebrow}
                </span>
                <strong className="mt-5 block text-2xl font-black leading-tight">
                  {item.title}
                </strong>
                <span className="mt-4 block min-h-16 font-bold leading-7 text-muted-foreground">
                  {item.body}
                </span>
                <span className="mt-8 flex items-end justify-between gap-4">
                  <span className="rounded bg-foreground px-3 py-2 font-black text-background">
                    {item.action}
                  </span>
                  <span className="text-5xl font-black leading-none text-[#ff8b3d] opacity-90">
                    {item.marker}
                  </span>
                </span>
              </a>
            ))}
          </div>
        </section>

        <section className="border-y-2 border-border bg-foreground text-background dark:bg-card dark:text-card-foreground">
          <div className="mx-auto grid w-[min(1200px,calc(100%_-_32px))] gap-4 py-12 md:grid-cols-2 lg:grid-cols-3">
            {learningResources.map((item) => (
              <a
                className="rounded border-2 border-background/30 bg-background/[0.08] p-5 text-background no-underline transition-colors hover:border-[#ff8b3d] hover:bg-background/[0.14] dark:text-card-foreground"
                href={item.href}
                key={item.href}
              >
                <h3 className="text-xl font-black leading-tight">
                  {item.title}
                </h3>
                <p className="mt-3 font-bold leading-7 text-background/70 dark:text-muted-foreground">
                  {item.body}
                </p>
              </a>
            ))}
          </div>
        </section>

        <section className="mx-auto grid w-[min(1200px,calc(100%_-_32px))] gap-4 py-12 md:grid-cols-[1.2fr_0.8fr] md:py-16">
          <div className="rounded border-2 border-border bg-card p-6">
            <p className="font-mono text-sm font-black text-muted-foreground">
              PROJECT CONTEXT
            </p>
            <h2 className="mt-3 text-3xl font-black text-primary">
              关于本项目
            </h2>
            <p className="mt-4 font-bold leading-8 text-muted-foreground">
              {project.description}。{content.entryLabel}；{content.dataPolicy}
            </p>
            <a
              className="mt-6 inline-flex rounded border-2 border-foreground bg-foreground px-4 py-3 font-black text-background no-underline"
              href="/heat-stroke/pages/about"
            >
              关于本项目
            </a>
          </div>
          <div className="rounded border-2 border-border bg-muted/50 p-6">
            <h2 className="text-2xl font-black">快速联系与声明</h2>
            <p className="mt-4 font-bold leading-8 text-muted-foreground">
              紧急情况请拨打 <strong className="text-primary">120</strong>
            </p>
            <p className="mt-3 font-bold leading-8 text-muted-foreground">
              本网站内容仅供参考，不替代专业医疗建议。如有紧急情况请立即就医。
            </p>
            <p className="mt-3 font-bold leading-8 text-muted-foreground">
              所有资料来源于互联网公开资料，已脱密处理，禁止商用，转载请联系作者。
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
