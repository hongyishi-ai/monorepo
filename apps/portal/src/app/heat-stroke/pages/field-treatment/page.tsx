import { platformProjects } from "@/lib/projects";
import { ProjectChrome } from "../../../_components/project/ProjectChrome";
import { buildProjectChromeNav } from "../../../_components/project/projectNav";
import { FloatingBackToTop } from "../_components/FloatingBackToTop";
import { HeatStrokeFieldTreatment } from "./HeatStrokeFieldTreatment";

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
  title: "热射病现场处置 | 红医师",
  description:
    "热射病现场处置流程模拟，覆盖预警识别、脱离热环境、快速降温、生命体征监测、气道保护和抽搐处理。",
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

export default function HeatStrokeFieldTreatmentPage() {
  return (
    <div
      className="min-h-screen overflow-x-hidden bg-background pb-[calc(env(safe-area-inset-bottom)_+_5.75rem)] text-foreground md:pb-0"
      data-hongyishi-project-page
    >
      <ProjectChrome
        activeBottomItemId="field-treatment"
        activeMenuItemId="field-treatment"
        bottomAriaLabel={projectChromeNav.bottomAriaLabel}
        bottomItems={projectChromeNav.bottomItems}
        brandHref="/heat-stroke/"
        menuAriaLabel="热射病项目移动端菜单"
        menuButtonLabel="打开热射病项目移动端导航菜单"
        menuItems={projectChromeNav.menuItems}
        menuPanelId="hys-mobile-top-menu-panel-heatStroke-fieldTreatment"
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
                Field Treatment
              </p>
              <h1 className="mt-3 max-w-3xl text-5xl font-black leading-none text-primary md:text-7xl">
                热射病现场处置
              </h1>
              <p className="mt-5 max-w-2xl text-base font-bold leading-8 text-muted-foreground md:text-lg">
                按 6
                步现场流程模拟热射病处置：先识别风险，再快速脱离热环境、降温、记录生命体征，并根据意识和抽搐情况执行后续处理。
              </p>
            </div>
            <div className="grid grid-cols-3 border-2 border-border bg-card text-center shadow-[6px_6px_0_rgba(18,49,60,0.14)] dark:shadow-[6px_6px_0_rgba(217,48,37,0.18)]">
              <div className="border-r-2 border-border p-4">
                <p className="font-mono text-3xl font-black text-primary">6</p>
                <p className="mt-1 text-xs font-black text-muted-foreground">
                  处置步骤
                </p>
              </div>
              <div className="border-r-2 border-border p-4">
                <p className="font-mono text-3xl font-black text-primary">
                  38.5
                </p>
                <p className="mt-1 text-xs font-black text-muted-foreground">
                  降温目标
                </p>
              </div>
              <div className="p-4">
                <p className="font-mono text-3xl font-black text-primary">
                  95%
                </p>
                <p className="mt-1 text-xs font-black text-muted-foreground">
                  氧疗警戒
                </p>
              </div>
            </div>
          </div>
        </section>

        <GovernanceBanner />
        <HeatStrokeFieldTreatment />
      </main>

      <FloatingBackToTop />
    </div>
  );
}
