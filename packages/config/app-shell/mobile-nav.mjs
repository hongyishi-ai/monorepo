export const mobileNavConfigs = {
  platform: {
    ariaLabel: "红医师移动端导航",
    titlePrefix: "打开红医师",
    tabs: [
      { id: "action", label: "处置", href: "/?tab=action" },
      { id: "tools", label: "工具", href: "/?tab=tools" },
      { id: "records", label: "记录", href: "/?tab=records" },
      { id: "library", label: "资料", href: "/?tab=library" },
    ],
  },
  heatStroke: {
    ariaLabel: "热射病项目移动端导航",
    titlePrefix: "打开热射病",
    tabs: [
      { id: "heat-index", label: "热指数", href: "pages/heat-index" },
      { id: "field-treatment", label: "处置", href: "pages/field-treatment" },
      { id: "rule", label: "法则", href: "pages/8-4-6-rule" },
      { id: "library", label: "资料", href: "" },
    ],
    menuTabs: [
      { id: "platform", label: "总入口", href: "/" },
      { id: "library", label: "项目首页", href: "" },
      { id: "heat-index", label: "热指数查询", href: "pages/heat-index" },
      {
        id: "field-treatment",
        label: "现场处置",
        href: "pages/field-treatment",
      },
      { id: "rule", label: "8-4-6法则", href: "pages/8-4-6-rule" },
      {
        id: "guide",
        label: "诊断与治疗指南",
        href: "pages/diagnosis-treatment-guideline",
      },
      {
        id: "consensus",
        label: "救治体系共识",
        href: "pages/treatment-system-consensus",
      },
      {
        id: "heat-tolerance",
        label: "热耐力评估",
        href: "pages/heat-tolerance",
      },
      {
        id: "cooling",
        label: "核心体温与降温",
        href: "pages/core-temperature-cooling",
      },
      { id: "challenge", label: "通关挑战", href: "pages/challenge" },
      { id: "about", label: "关于项目", href: "pages/about" },
    ],
  },
  tccc: {
    ariaLabel: "TCCC 项目移动端导航",
    titlePrefix: "打开 TCCC ",
    tabs: [
      { id: "standard", label: "标准", href: "pages/tccc-standard" },
      { id: "tfc", label: "TFC", href: "pages/tfc-hemorrhage" },
      { id: "tacevac", label: "TACEVAC", href: "pages/tacevac-reassessment" },
      { id: "directory", label: "目录", href: "" },
    ],
    menuTabs: [
      { id: "platform", label: "总入口", href: "/" },
      { id: "directory", label: "项目首页", href: "" },
      { id: "standard", label: "标准流程", href: "pages/tccc-standard" },
      { id: "tfc", label: "TFC 大出血", href: "pages/tfc-hemorrhage" },
      { id: "airway", label: "TFC 气道", href: "pages/tfc-airway" },
      { id: "breathing", label: "呼吸管理", href: "pages/tccc-breathing" },
      {
        id: "hypothermia",
        label: "低体温预防",
        href: "pages/tccc-hypothermia",
      },
      {
        id: "tacevac",
        label: "TACEVAC 复评",
        href: "pages/tacevac-reassessment",
      },
      { id: "course", label: "课程目录", href: "pages/tccc-flow-framework" },
    ],
  },
};

export function normalizeMobileNavBasePath(basePath) {
  if (!basePath || basePath === "/") {
    return "/";
  }

  let normalized = basePath.startsWith("/") ? basePath : `/${basePath}`;
  normalized = normalized.endsWith("/") ? normalized : `${normalized}/`;
  return normalized;
}

export function resolveMobileNavItems(scope, basePath = "/", options = {}) {
  const config =
    options.config ?? mobileNavConfigs[scope] ?? mobileNavConfigs.platform;
  const sourceTabs =
    options.surface === "menu"
      ? (options.menuTabs ?? config.menuTabs ?? config.tabs)
      : (options.tabs ?? config.tabs);

  return sourceTabs.map((tab) => ({
    ...tab,
    href: joinMobileNavBasePath(basePath, tab.href),
  }));
}

function joinMobileNavBasePath(basePath, relativeHref) {
  if (relativeHref.startsWith("/")) {
    return relativeHref;
  }

  const base = normalizeMobileNavBasePath(basePath);

  if (!relativeHref) {
    return base;
  }

  return `${base}${relativeHref.replace(/^\/+/, "")}`;
}
