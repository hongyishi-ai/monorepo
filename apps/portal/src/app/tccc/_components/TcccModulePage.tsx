import { ProjectChrome } from "../../_components/project/ProjectChrome";
import { buildProjectChromeNav } from "../../_components/project/projectNav";
import type { TcccModuleEntry } from "../_data/tcccFlowRegistry";
import { TcccDecisionFlow } from "./TcccDecisionFlow";

const projectChromeNav = buildProjectChromeNav("tccc", "/tccc/");

export function TcccModulePage({ module }: { module: TcccModuleEntry }) {
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
        <TcccDecisionFlow definition={module.flow} />
      </main>
    </div>
  );
}
