import { platformProjects } from "@/lib/projects";
import { ProjectChrome } from "../../../_components/project/ProjectChrome";
import { buildProjectChromeNav } from "../../../_components/project/projectNav";
import { FloatingBackToTop } from "../_components/FloatingBackToTop";
import { HeatStrokeChallenge } from "./HeatStrokeChallenge";

function getHeatStrokeProject() {
  const entry = platformProjects.find((item) => item.id === "heat-stroke");

  if (!entry) {
    throw new Error("Missing heat-stroke project registry entry");
  }

  return entry;
}

const project = getHeatStrokeProject();
const projectChromeNav = buildProjectChromeNav("heatStroke", "/heat-stroke/");

export const metadata = {
  title: "热射病通关挑战 | 红医师",
  description:
    "热射病预防与救治学习挑战，覆盖预防措施、预警信号、救治步骤和综合测验。",
};

function GovernanceBanner() {
  const content = project.content;

  return (
    <aside
      aria-label="内容审核状态"
      className="border-b-2 border-border bg-background"
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
  );
}

export default function HeatStrokeChallengePage() {
  return (
    <div
      className="min-h-screen overflow-x-hidden bg-background pb-[calc(env(safe-area-inset-bottom)_+_5.75rem)] text-foreground md:pb-0"
      data-hongyishi-project-page
    >
      <ProjectChrome
        activeBottomItemId="library"
        activeMenuItemId="challenge"
        bottomAriaLabel={projectChromeNav.bottomAriaLabel}
        bottomItems={projectChromeNav.bottomItems}
        brandHref="/heat-stroke/"
        menuAriaLabel="热射病项目移动端菜单"
        menuButtonLabel="打开热射病项目移动端导航菜单"
        menuItems={projectChromeNav.menuItems}
        menuPanelId="hys-mobile-top-menu-panel-heatStroke-challenge"
        navAriaLabel="热射病防治导航"
        projectLabel="热射病防治"
        scope="heatStroke"
        titlePrefix={projectChromeNav.titlePrefix}
      />

      <main id="main">
        <section className="border-b-2 border-border bg-muted/30">
          <div className="mx-auto grid w-[min(1200px,calc(100%_-_32px))] gap-6 py-10 md:grid-cols-[1fr_0.9fr] md:items-end md:py-14">
            <div>
              <p className="font-mono text-xs font-black uppercase text-muted-foreground">
                Learning Game
              </p>
              <h1 className="mt-3 max-w-3xl text-5xl font-black leading-none text-primary md:text-7xl">
                热射病通关挑战
              </h1>
              <p className="mt-5 max-w-2xl text-base font-bold leading-8 text-muted-foreground md:text-lg">
                通过情景判断、预防措施分类、预警信号识别、救治步骤排序和综合测验，复盘热射病预防与救治关键点。
              </p>
            </div>
            <div className="grid grid-cols-3 border-2 border-border bg-card text-center shadow-[6px_6px_0_rgba(18,49,60,0.14)] dark:shadow-[6px_6px_0_rgba(217,48,37,0.18)]">
              <div className="border-r-2 border-border p-4">
                <p className="font-mono text-3xl font-black text-primary">5</p>
                <p className="mt-1 text-xs font-black text-muted-foreground">
                  关卡
                </p>
              </div>
              <div className="border-r-2 border-border p-4">
                <p className="font-mono text-3xl font-black text-primary">15</p>
                <p className="mt-1 text-xs font-black text-muted-foreground">
                  终测题
                </p>
              </div>
              <div className="p-4">
                <p className="font-mono text-3xl font-black text-primary">6</p>
                <p className="mt-1 text-xs font-black text-muted-foreground">
                  徽章
                </p>
              </div>
            </div>
          </div>
        </section>

        <GovernanceBanner />
        <HeatStrokeChallenge />
      </main>

      <FloatingBackToTop />
    </div>
  );
}
