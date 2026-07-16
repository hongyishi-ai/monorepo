import { ProjectChrome } from "../../_components/project/ProjectChrome";
import { buildProjectChromeNav } from "../../_components/project/projectNav";
import type { TcccModuleEntry } from "../_data/tcccFlowRegistry";
import { TcccDecisionFlow } from "./TcccDecisionFlow";

const projectChromeNav = buildProjectChromeNav("tccc", "/tccc/");
const guidelineUrl =
  "https://books.allogy.com/web/tenant/8/books/b729b76a-1a34-4bf7-b76b-66bb2072b2a7/";

export function TcccModulePage({ module }: { module: TcccModuleEntry }) {
  const scopeNote =
    module.stage === "TACEVAC"
      ? "本页覆盖 TCCC 向后送阶段过渡与持续复评；完整 TACEVAC 指南现由 CoERCCC 单独管理。"
      : `范围：${module.section}`;

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-background pb-[calc(env(safe-area-inset-bottom)_+_5.75rem)] text-foreground md:pb-0"
      data-hongyishi-project-page
      data-tccc-module={module.slug}
    >
      <ProjectChrome
        activeBottomItemId={module.activeBottomItemId}
        activeMenuItemId={module.activeMenuItemId ?? "directory"}
        bottomAriaLabel={projectChromeNav.bottomAriaLabel}
        bottomItems={projectChromeNav.bottomItems}
        brandHref="/tccc/"
        menuAriaLabel="TCCC 项目移动端菜单"
        menuButtonLabel="打开 TCCC 项目移动端导航菜单"
        menuItems={projectChromeNav.menuItems}
        menuPanelId={`hys-mobile-top-menu-panel-tccc-${module.slug}`}
        navAriaLabel="红医师战场救护导航"
        projectLabel="战场救护"
        scope="tccc"
        titlePrefix={projectChromeNav.titlePrefix}
      />

      <main id="main">
        <aside
          aria-label="本页内容审核状态"
          className="border-b-2 border-border bg-muted/45"
          data-hongyishi-content-governance
        >
          <div className="mx-auto grid w-[min(1200px,calc(100%_-_32px))] grid-cols-1 gap-2 py-3 font-mono text-xs font-bold leading-5 text-muted-foreground md:grid-cols-[auto_1fr] md:items-center">
            <span className="w-fit border-2 border-primary bg-primary px-2 py-1 font-black text-primary-foreground">
              已对照原文 · 待医学专家终审
            </span>
            <span className="text-foreground">
              本页依据 JTS / CoTCCC《TCCC 指南》2026-05-01 版复核
            </span>
            <span className="md:col-span-2">
              {scopeNote} ·
              仅供教育训练，不替代正式认证课程、医疗指挥链和临床判断。{" "}
              <a
                className="font-black text-foreground underline underline-offset-4"
                href={guidelineUrl}
                rel="noreferrer"
                target="_blank"
              >
                查看 JTS / CoTCCC 原文
              </a>
            </span>
          </div>
        </aside>

        <TcccDecisionFlow definition={module.flow} />
      </main>
    </div>
  );
}
