declare module "@hongyishi/config/app-shell/mobile-nav" {
  export type MobileNavItem = {
    id: string;
    label: string;
    href: string;
  };

  export type MobileNavConfig = {
    ariaLabel: string;
    titlePrefix: string;
    tabs: MobileNavItem[];
    menuTabs?: MobileNavItem[];
  };

  export const mobileNavConfigs: Record<string, MobileNavConfig>;

  export function resolveMobileNavItems(
    scope: string,
    basePath?: string,
    options?: {
      surface?: "menu";
      config?: MobileNavConfig;
      tabs?: MobileNavItem[];
      menuTabs?: MobileNavItem[];
    },
  ): MobileNavItem[];
}
