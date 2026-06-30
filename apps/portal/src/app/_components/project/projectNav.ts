import {
  mobileNavConfigs,
  resolveMobileNavItems,
  type MobileNavItem,
} from "@hongyishi/config/app-shell/mobile-nav";

import type { ProjectNavItem } from "./ProjectChrome";

type NextOwnedStaticProjectScope = "heatStroke" | "tccc";

type ProjectChromeNav = {
  bottomAriaLabel: string;
  bottomItems: ProjectNavItem[];
  menuItems: ProjectNavItem[];
  titlePrefix: string;
};

function toProjectNavItems(items: MobileNavItem[]): ProjectNavItem[] {
  return items.map((item) => ({
    id: item.id,
    label: item.label,
    href: item.href,
  }));
}

export function buildProjectChromeNav(
  scope: NextOwnedStaticProjectScope,
  basePath: string,
): ProjectChromeNav {
  const config = mobileNavConfigs[scope];

  if (!config) {
    throw new Error(`Missing mobile navigation config for ${scope}`);
  }

  return {
    bottomAriaLabel: config.ariaLabel,
    bottomItems: toProjectNavItems(resolveMobileNavItems(scope, basePath)),
    menuItems: toProjectNavItems(
      resolveMobileNavItems(scope, basePath, { surface: "menu" }),
    ),
    titlePrefix: config.titlePrefix,
  };
}
