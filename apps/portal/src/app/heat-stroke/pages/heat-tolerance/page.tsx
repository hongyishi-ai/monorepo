import { platformProjects } from "@/lib/projects";
import { ProjectChrome } from "../../../_components/project/ProjectChrome";
import { buildProjectChromeNav } from "../../../_components/project/projectNav";
import { FloatingBackToTop } from "../_components/FloatingBackToTop";
import { HeatToleranceAssessment } from "./HeatToleranceAssessment";

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
  title: "热耐力评估 | 红医师",
  description:
    "热耐力评分表，保留身高体重 BMI 自动判定和 18 题评分逻辑，用于训练前自我热适应能力参考评估。",
};

export default function HeatTolerancePage() {
  return (
    <div
      className="min-h-screen overflow-x-hidden bg-background pb-[calc(env(safe-area-inset-bottom)_+_5.75rem)] text-foreground md:pb-0"
      data-hongyishi-project-page
    >
      <ProjectChrome
        activeBottomItemId="library"
        activeMenuItemId="heat-tolerance"
        bottomAriaLabel={projectChromeNav.bottomAriaLabel}
        bottomItems={projectChromeNav.bottomItems}
        brandHref="/heat-stroke/"
        menuAriaLabel="热射病项目移动端菜单"
        menuButtonLabel="打开热射病项目移动端导航菜单"
        menuItems={projectChromeNav.menuItems}
        menuPanelId="hys-mobile-top-menu-panel-heatStroke-heatTolerance"
        navAriaLabel="热射病防治导航"
        projectLabel="热射病防治"
        scope="heatStroke"
        titlePrefix={projectChromeNav.titlePrefix}
      />

      <main id="main">
        <section className="border-b-2 border-border bg-muted/30">
          <div className="mx-auto grid w-[min(1200px,calc(100%_-_32px))] gap-6 py-10 md:grid-cols-[1.05fr_0.95fr] md:items-end md:py-14">
            <div>
              <p className="font-mono text-xs font-black uppercase text-muted-foreground">
                Assessment Tool
              </p>
              <h1 className="mt-3 max-w-3xl text-5xl font-black leading-none text-primary md:text-7xl">
                热耐力评估
              </h1>
              <p className="mt-5 max-w-2xl text-base font-bold leading-8 text-muted-foreground md:text-lg">
                保留原有评分表逻辑：BMI 自动完成第 1 题，第 2 至第 18 题每题 1-5
                分，提交后给出总分和热耐力解释。
              </p>
            </div>
            <div className="grid grid-cols-3 border-2 border-border bg-card text-center shadow-[6px_6px_0_rgba(18,49,60,0.14)] dark:shadow-[6px_6px_0_rgba(217,48,37,0.18)]">
              <div className="border-r-2 border-border p-4">
                <p className="font-mono text-3xl font-black text-primary">18</p>
                <p className="mt-1 text-xs font-black text-muted-foreground">
                  题
                </p>
              </div>
              <div className="border-r-2 border-border p-4">
                <p className="font-mono text-3xl font-black text-primary">90</p>
                <p className="mt-1 text-xs font-black text-muted-foreground">
                  满分
                </p>
              </div>
              <div className="p-4">
                <p className="font-mono text-3xl font-black text-primary">
                  BMI
                </p>
                <p className="mt-1 text-xs font-black text-muted-foreground">
                  自动
                </p>
              </div>
            </div>
          </div>
        </section>

        <HeatToleranceAssessment />
      </main>

      <FloatingBackToTop />
    </div>
  );
}
