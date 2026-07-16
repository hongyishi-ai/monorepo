import { platformProjects } from "@/lib/projects";
import { ProjectChrome } from "../_components/project/ProjectChrome";
import { buildProjectChromeNav } from "../_components/project/projectNav";
import { tcccModuleBySlug, tcccModuleGroups } from "./_data/tcccFlowRegistry";

function getTcccProject() {
  const entry = platformProjects.find((item) => item.id === "tccc");

  if (!entry) {
    throw new Error("Missing tccc project registry entry");
  }

  return entry;
}

const project = getTcccProject();
const projectChromeNav = buildProjectChromeNav("tccc", "/tccc/");

const primarySlugs = [
  "tccc-standard",
  "tfc-hemorrhage",
  "tfc-airway",
  "tccc-breathing",
] as const;

const primaryFlows = primarySlugs.flatMap((slug) => {
  const module = tcccModuleBySlug.get(slug);
  return module ? [module] : [];
});

const moduleGroups = tcccModuleGroups.map((group) => ({
  ...group,
  modules: group.slugs.flatMap((slug) => {
    const module = tcccModuleBySlug.get(slug);
    return module ? [module] : [];
  }),
}));

export const metadata = {
  title: "战场救护 TCCC | 红医师",
  description: project.description,
};

export default function TcccPage() {
  const content = project.content;

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-background pb-[calc(env(safe-area-inset-bottom)_+_5.75rem)] text-foreground md:pb-0"
      data-hongyishi-project-page
    >
      <ProjectChrome
        activeBottomItemId="directory"
        activeMenuItemId="directory"
        bottomAriaLabel={projectChromeNav.bottomAriaLabel}
        bottomItems={projectChromeNav.bottomItems}
        brandHref="/tccc/"
        menuAriaLabel="TCCC 项目移动端菜单"
        menuButtonLabel="打开 TCCC 项目移动端导航菜单"
        menuItems={projectChromeNav.menuItems}
        menuPanelId="hys-mobile-top-menu-panel-tccc"
        navAriaLabel="红医师战场救护导航"
        projectLabel="战场救护"
        scope="tccc"
        titlePrefix={projectChromeNav.titlePrefix}
      />

      <main id="main">
        <section
          aria-labelledby="tccc-title"
          className="relative isolate flex min-h-[calc(100svh_-_84px)] items-end overflow-hidden border-b-2 border-border lg:min-h-[calc(100svh_-_80px)]"
        >
          <img
            alt="战场救护 TCCC 海报"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
            src={project.coverImage}
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(0,0,0,0.94)_0%,rgba(18,49,60,0.84)_48%,rgba(217,48,37,0.34)_100%)]" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(244,236,220,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(244,236,220,0.08)_1px,transparent_1px)] bg-[size:64px_64px]" />

          <div className="mx-auto w-[min(1200px,calc(100%_-_32px))] pb-[calc(env(safe-area-inset-bottom)_+_7rem)] pt-12 text-background dark:text-foreground md:py-20">
            <p className="mb-4 inline-flex items-center gap-3 font-mono text-sm font-black text-background/80 dark:text-foreground/80">
              <span className="h-1 w-10 bg-primary" aria-hidden="true" />
              TACTICAL COMBAT CASUALTY CARE
            </p>
            <h1
              className="max-w-4xl text-[clamp(3.4rem,10vw,7rem)] font-black leading-[0.9] tracking-normal"
              id="tccc-title"
            >
              <span className="text-primary">TCCC</span>
              <br />
              战术战伤救护流程
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-bold leading-8 text-background/85 dark:text-foreground/85 md:text-xl">
              分阶段对照 JTS / CoTCCC 指南复核的交互式决策流程
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                className="inline-flex min-h-12 items-center justify-center rounded border-2 border-background bg-primary px-5 font-black text-primary-foreground no-underline shadow-[5px_5px_0_rgba(244,236,220,0.24)] transition-transform active:translate-x-1 active:translate-y-1"
                href="/tccc/pages/tccc-standard"
              >
                查看标准流程
              </a>
              <a
                className="inline-flex min-h-12 items-center justify-center rounded border-2 border-background bg-background/95 px-5 font-black text-[#12313c] no-underline shadow-[5px_5px_0_rgba(217,48,37,0.35)] transition-transform active:translate-x-1 active:translate-y-1 dark:border-foreground dark:bg-foreground dark:text-background"
                href="/tccc/pages/tfc-hemorrhage"
              >
                进入 TFC 大出血
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
                TFC FIRST LINE
              </p>
              <h2 className="mt-2 text-4xl font-black leading-none text-primary md:text-5xl">
                关键流程入口
              </h2>
            </div>
            <p className="max-w-xl font-bold leading-7 text-muted-foreground">
              全部 34 个交互学习入口已按 2026-05-01
              指南复核，当前统一标记为待医学专家终审。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {primaryFlows.map((item) => (
              <a
                className="group relative overflow-hidden rounded border-2 border-border bg-card p-5 text-card-foreground no-underline shadow-[6px_6px_0_rgba(18,49,60,0.16)] transition-transform hover:-translate-y-1 dark:shadow-[6px_6px_0_rgba(217,48,37,0.24)]"
                href={`/tccc/pages/${item.slug}`}
                key={item.slug}
              >
                <span className="font-mono text-xs font-black text-primary">
                  {item.stage} · {item.section}
                </span>
                <strong className="mt-5 block text-2xl font-black leading-tight">
                  {item.title}
                </strong>
                <span className="mt-4 block min-h-24 font-bold leading-7 text-muted-foreground">
                  {item.summary}
                </span>
                <span className="mt-8 flex items-end justify-between gap-4">
                  <span className="rounded bg-foreground px-3 py-2 font-black text-background">
                    进入训练
                  </span>
                  <span className="font-mono text-xl font-black leading-none text-primary opacity-90">
                    {item.shortTitle}
                  </span>
                </span>
              </a>
            ))}
          </div>
        </section>

        <section className="border-y-2 border-border bg-foreground py-12 text-background dark:bg-card dark:text-card-foreground">
          <div className="mx-auto w-[min(1200px,calc(100%_-_32px))] space-y-10">
            {moduleGroups.map((group) => (
              <section
                aria-labelledby={`tccc-group-${group.id}`}
                key={group.id}
              >
                <div className="mb-4 flex items-end justify-between gap-4 border-b-2 border-background/30 pb-3 dark:border-border">
                  <h2
                    className="text-2xl font-black text-background dark:text-card-foreground md:text-3xl"
                    id={`tccc-group-${group.id}`}
                  >
                    {group.title}
                  </h2>
                  <span className="font-mono text-xs font-black text-background/60 dark:text-muted-foreground">
                    {group.modules.length} 个模块
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {group.modules.map((module) => (
                    <a
                      className="min-w-0 rounded border-2 border-background/30 bg-background/[0.08] p-5 text-background no-underline transition-colors hover:border-primary hover:bg-background/[0.14] dark:text-card-foreground"
                      href={`/tccc/pages/${module.slug}`}
                      key={module.slug}
                    >
                      <span className="font-mono text-xs font-black text-background/60 dark:text-muted-foreground">
                        {module.stage} · {module.section}
                      </span>
                      <h3 className="mt-3 text-xl font-black leading-tight">
                        {module.title}
                      </h3>
                      <p className="mt-3 font-bold leading-7 text-background/70 dark:text-muted-foreground">
                        {module.summary}
                      </p>
                    </a>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>

        <section className="mx-auto grid w-[min(1200px,calc(100%_-_32px))] gap-4 py-12 md:grid-cols-[1.2fr_0.8fr] md:py-16">
          <div className="rounded border-2 border-border bg-card p-6">
            <p className="font-mono text-sm font-black text-muted-foreground">
              PROJECT CONTEXT
            </p>
            <h2 className="mt-3 text-3xl font-black text-primary">使用边界</h2>
            <p className="mt-4 font-bold leading-8 text-muted-foreground">
              仅供教育训练和流程学习，不能替代现行作战医疗规范、医疗指挥链或正式认证课程。
            </p>
            <p className="mt-4 font-bold leading-8 text-muted-foreground">
              {project.description}。{content.entryLabel}；{content.dataPolicy}
            </p>
          </div>
          <div className="rounded border-2 border-border bg-muted/50 p-6">
            <h2 className="text-2xl font-black">统一 Next 学习流程</h2>
            <p className="mt-4 font-bold leading-8 text-muted-foreground">
              旧版深层 HTML
              已停止发布。所有学习页共享同一决策引擎、主题、导航、移动控制条和内容治理状态。
            </p>
            <a
              className="mt-6 inline-flex rounded border-2 border-foreground bg-foreground px-4 py-3 font-black text-background no-underline"
              href="/tccc/pages/tccc-flow-framework"
            >
              打开课程目录
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
