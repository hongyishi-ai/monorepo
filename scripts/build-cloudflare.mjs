#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  copyFile,
  cp,
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");

export const CLOUDFLARE_FREE_TIER_LIMITS = {
  maxFiles: 20_000,
  maxFileBytes: 25 * 1024 * 1024,
};

export const contentGovernance = {
  heatStroke: {
    label: "热射病防治",
    sourceName: "热射病防治指南与现场处置资料",
    version: "指南/专家共识汇编，本地训练工具版",
    reviewedAt: "2026-06-17",
    statusLabel: "待复核",
    disclaimer: "仅供训练和现场处置参考，不替代急救指挥、临床诊疗和当地规范。",
    officialUpdateUrl: "https://www.nhc.gov.cn/",
  },
  tccc: {
    label: "战场救护 TCCC",
    sourceName: "CoTCCC 2017 战术战伤救护流程资料",
    version: "CoTCCC 2017 基础内容，需按 JTS/Deployed Medicine 更新复核",
    reviewedAt: "2026-06-17",
    statusLabel: "待复核",
    disclaimer:
      "仅供教育训练和流程学习，不能替代现行作战医疗规范、医疗指挥链或正式认证课程。",
    officialUpdateUrl: "https://jts.health.mil/index.cfm/committees/cotccc",
  },
};

export const heatStrokePageAliases = new Map([
  ["8-4-6黄金法则.html", "8-4-6-rule.html"],
  ["中国热射病诊断与治疗指南.html", "diagnosis-treatment-guideline.html"],
  ["关于本项目.html", "about.html"],
  ["热射病救治体系建设标准专家共识.html", "treatment-system-consensus.html"],
  ["热射病核心体温监测与降温方法.html", "core-temperature-cooling.html"],
  ["热射病现场处置.html", "field-treatment.html"],
  ["热射病通关挑战.html", "challenge.html"],
  ["热指数查询.html", "heat-index.html"],
  ["热耐力评估.html", "heat-tolerance.html"],
]);

export const tcccPageAliases = new Map([
  ["TACEVAC休克与液体复苏.html", "tacevac-shock-fluid.html"],
  ["TACEVAC再评估.html", "tacevac-reassessment.html"],
  ["TACEVAC创伤性脑损伤.html", "tacevac-tbi.html"],
  ["TACEVAC呼吸管理.html", "tacevac-breathing.html"],
  ["TACEVAC开放气道.html", "tacevac-airway.html"],
  ["TACEVAC护理交接.html", "tacevac-handoff.html"],
  ["TACEVAC疼痛管理.html", "tacevac-pain-management.html"],
  ["TACEVAC静脉通路与止血酸.html", "tacevac-iv-txa.html"],
  ["TACEVAC预防低体温.html", "tacevac-hypothermia.html"],
  ["TACEVAC骨盆绑带流程.html", "tacevac-pelvic-binder.html"],
  ["TCCC休克与液体复苏.html", "tccc-shock-fluid.html"],
  ["TCCC伤口处理.html", "tccc-wound-care.html"],
  ["TCCC伤员沟通.html", "tccc-casualty-communication.html"],
  ["TCCC准备撤离.html", "tccc-evac-prep.html"],
  ["TCCC呼吸管理算法.html", "tccc-breathing.html"],
  ["TCCC战伤流程数据.js", "tccc-flow-data.js"],
  ["TCCC标准流程.html", "tccc-standard.html"],
  ["TCCC流程框架.html", "tccc-flow-framework.html"],
  ["TCCC疼痛管理.html", "tccc-pain-management.html"],
  ["TCCC静脉通路与止血酸.html", "tccc-iv-txa.html"],
  ["TCCC预防低体温.html", "tccc-hypothermia.html"],
  ["TCCC骨盆绑带流程.html", "tccc-pelvic-binder.html"],
  ["TFC大出血算法.html", "tfc-hemorrhage.html"],
  ["TFC气道算法.html", "tfc-airway.html"],
  ["循环系统教案.html", "circulation-course.html"],
]);

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
  },
};

export function normalizeBasePath(basePath) {
  if (!basePath || basePath === "/") {
    return "/";
  }

  let normalized = basePath.startsWith("/") ? basePath : `/${basePath}`;
  normalized = normalized.endsWith("/") ? normalized : `${normalized}/`;
  return normalized;
}

function joinBasePath(basePath, relativeHref) {
  if (relativeHref.startsWith("/")) {
    return relativeHref;
  }

  const base = normalizeBasePath(basePath);

  if (!relativeHref) {
    return base;
  }

  return `${base}${relativeHref.replace(/^\/+/, "")}`;
}

export function resolveProjectMobileActiveTab(project, relativePath) {
  const normalizedPath = relativePath.split(path.sep).join("/");
  const fileName = path.posix.basename(normalizedPath);

  if (project === "heatStroke") {
    if (fileName === "heat-index.html") return "heat-index";
    if (fileName === "field-treatment.html") return "field-treatment";
    if (fileName === "8-4-6-rule.html") return "rule";
    return "library";
  }

  if (project === "tccc") {
    if (
      fileName === "tccc-standard.html" ||
      fileName === "tccc-flow-framework.html"
    )
      return "standard";
    if (fileName.startsWith("tfc-")) return "tfc";
    if (fileName.startsWith("tacevac-")) return "tacevac";
    return "directory";
  }

  return undefined;
}

function resolveHeatStrokeMenuActiveItem(relativePath) {
  const normalizedPath = relativePath.split(path.sep).join("/");
  const fileName = path.posix.basename(normalizedPath);

  if (fileName === "heat-index.html") return "heat-index";
  if (fileName === "field-treatment.html") return "field-treatment";
  if (fileName === "8-4-6-rule.html") return "rule";
  if (fileName === "diagnosis-treatment-guideline.html") return "guide";
  if (fileName === "treatment-system-consensus.html") return "consensus";
  if (fileName === "heat-tolerance.html") return "heat-tolerance";
  if (fileName === "core-temperature-cooling.html") return "cooling";
  if (fileName === "challenge.html") return "challenge";
  if (fileName === "about.html") return "about";
  return "library";
}

export function buildRedirects({
  fmsBase = "/fms/",
  heatStrokeBase = "/heat-stroke/",
  tcccBase = "/tccc/",
} = {}) {
  const fms = normalizeBasePath(fmsBase);
  const heatStroke = normalizeBasePath(heatStrokeBase);
  const tccc = normalizeBasePath(tcccBase);
  const fmsNoSlash = fms.slice(0, -1);
  const heatStrokeNoSlash = heatStroke.slice(0, -1);
  const tcccNoSlash = tccc.slice(0, -1);

  return [
    "# Generated by scripts/build-cloudflare.mjs",
    `${fmsNoSlash} ${fms} 301`,
    `${heatStrokeNoSlash} ${heatStroke} 301`,
    `${tcccNoSlash} ${tccc} 301`,
    "",
  ].join("\n");
}

export function buildHeaders({
  fmsBase = "/fms/",
  heatStrokeBase = "/heat-stroke/",
  tcccBase = "/tccc/",
} = {}) {
  const fms = normalizeBasePath(fmsBase);
  const heatStroke = normalizeBasePath(heatStrokeBase);
  const tccc = normalizeBasePath(tcccBase);
  const contentSecurityPolicy = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
    "img-src 'self' data: blob: https://openweathermap.org https://*.openweathermap.org https://www.xiaoyuzhoufm.com",
    "font-src 'self' data: https://cdnjs.cloudflare.com",
    "connect-src 'self' https://cloudflareinsights.com",
    "media-src 'self' blob:",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");

  return [
    "# Generated by scripts/build-cloudflare.mjs",
    "/*",
    "  X-Frame-Options: DENY",
    "  X-Content-Type-Options: nosniff",
    "  Referrer-Policy: strict-origin-when-cross-origin",
    "  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()",
    `  Content-Security-Policy: ${contentSecurityPolicy}`,
    "",
    "/_next/static/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "",
    `${fms}assets/*`,
    "  Cache-Control: public, max-age=31536000, immutable",
    "",
    `${heatStroke}assets/*`,
    "  Cache-Control: public, max-age=31536000, immutable",
    "",
    `${tccc}icons/*`,
    "  Cache-Control: public, max-age=31536000, immutable",
    "",
    `${tccc}assets/*`,
    "  Cache-Control: public, max-age=31536000, immutable",
    "",
    `${tccc}images/*`,
    "  Cache-Control: public, max-age=31536000, immutable",
    "",
    `${tccc}videos/*`,
    "  Cache-Control: public, max-age=31536000, immutable",
    "",
    `${fms}sw.js`,
    "  Cache-Control: no-cache",
    "",
    `${heatStroke}sw.js`,
    "  Cache-Control: no-cache",
    "",
    `${tccc}sw.js`,
    "  Cache-Control: no-cache",
    "",
    `${fms}manifest.webmanifest`,
    "  Cache-Control: public, max-age=300",
    "",
    `${heatStroke}manifest.json`,
    "  Cache-Control: public, max-age=300",
    "",
    `${tccc}manifest.json`,
    "  Cache-Control: public, max-age=300",
    "",
  ].join("\n");
}

export function shouldCopyHeatStrokePath(relativePath) {
  const normalized = relativePath.split(path.sep).join("/");
  const fileName = path.posix.basename(normalized);

  if (fileName.startsWith(".") || normalized.includes("/.")) {
    return false;
  }

  if (
    normalized === "assets/vendors/tailwind.compiler.js" ||
    normalized === "assets/vendors/framer-motion.js"
  ) {
    return false;
  }

  if (["index.html", "manifest.json", "sw.js"].includes(normalized)) {
    return true;
  }

  return normalized.startsWith("assets/") || normalized.startsWith("pages/");
}

export function mapHeatStrokeOutputPath(relativePath) {
  const normalized = relativePath.split(path.sep).join("/");

  if (!normalized.startsWith("pages/")) {
    return normalized;
  }

  const fileName = path.posix.basename(normalized);
  const alias = heatStrokePageAliases.get(fileName);

  if (!alias) {
    return normalized;
  }

  return path.posix.join(path.posix.dirname(normalized), alias);
}

export function shouldCopyTcccPath(relativePath) {
  const normalized = relativePath.split(path.sep).join("/");
  const fileName = path.posix.basename(normalized);

  if (fileName.startsWith(".") || normalized.includes("/.")) {
    return false;
  }

  if (
    [
      "index.html",
      "manifest.json",
      "sw.js",
      "pwa-register.js",
      "offline.html",
      "README.md",
    ].includes(normalized)
  ) {
    return true;
  }

  return (
    normalized.startsWith("icons/") ||
    normalized.startsWith("assets/") ||
    normalized.startsWith("images/") ||
    normalized.startsWith("videos/") ||
    normalized.startsWith("pages/")
  );
}

export function mapTcccOutputPath(relativePath) {
  const normalized = relativePath.split(path.sep).join("/");

  if (!normalized.startsWith("pages/")) {
    return normalized;
  }

  const fileName = path.posix.basename(normalized);
  const alias = tcccPageAliases.get(fileName);

  if (!alias) {
    return normalized;
  }

  return path.posix.join(path.posix.dirname(normalized), alias);
}

function isTextFile(relativePath) {
  return /\.(html|css|js|json|txt|md|webmanifest)$/i.test(relativePath);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function rewritePageAliases(content, aliases) {
  let output = content;

  for (const [sourceName, alias] of aliases) {
    const escapedSource = escapeRegExp(sourceName);
    const escapedEncodedSource = escapeRegExp(encodeURI(sourceName));

    output = output
      .replace(new RegExp(`(pages/)${escapedSource}`, "g"), `$1${alias}`)
      .replace(new RegExp(`(pages/)${escapedEncodedSource}`, "g"), `$1${alias}`)
      .replace(
        new RegExp(`((?:href|src)=["'])${escapedSource}`, "g"),
        `$1${alias}`,
      )
      .replace(
        new RegExp(`((?:href|src)=["'])${escapedEncodedSource}`, "g"),
        `$1${alias}`,
      );
  }

  return output;
}

function rewritePageHrefExtensions(content) {
  return content.replace(
    /\bhref=(["'])([^"']+?)(\.html)(#[^"']*)?\1/g,
    (match, quote, href, _extension, hash = "") => {
      if (
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("//") ||
        href.startsWith("../") ||
        href === "index" ||
        href === "offline"
      ) {
        return match;
      }

      if (
        href.includes("/pages/") ||
        href.startsWith("pages/") ||
        !href.includes("/")
      ) {
        return `href=${quote}${href}${hash}${quote}`;
      }

      return match;
    },
  );
}

export function injectMobileBottomNav(
  content,
  activeTab = "tools",
  options = {},
) {
  if (
    !/<\/body>/i.test(content) ||
    /<nav\b[^>]*data-hongyishi-mobile-nav/i.test(content)
  ) {
    return content;
  }

  const scope = options.scope ?? "platform";
  const config =
    options.config ?? mobileNavConfigs[scope] ?? mobileNavConfigs.platform;
  const basePath = options.basePath ?? "/";
  const tabs = config.tabs.map((tab) => ({
    ...tab,
    href: joinBasePath(basePath, tab.href),
  }));

  const navItems = tabs
    .map((tab) => {
      const activeClass =
        tab.id === activeTab ? " hys-mobile-nav__item--active" : "";
      const ariaCurrent = tab.id === activeTab ? ' aria-current="page"' : "";
      const title = `${config.titlePrefix}${tab.label}`;
      return `<a class="hys-mobile-nav__item${activeClass}" href="${escapeHtml(tab.href)}"${ariaCurrent} title="${escapeHtml(title)}"><span>${escapeHtml(tab.label)}</span></a>`;
    })
    .join("");

  const nav = `
<style data-hongyishi-mobile-nav>
@media (min-width: 769px) {
  .hys-mobile-nav {
    display: none;
  }
}
@media (max-width: 768px) {
  body {
    padding-bottom: calc(86px + env(safe-area-inset-bottom)) !important;
  }
  .hys-mobile-nav {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2147483000;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 4px;
    border-top: 2px solid #111;
    background: rgba(244, 236, 220, 0.96);
    padding: 8px 12px calc(8px + env(safe-area-inset-bottom));
    box-shadow: 0 -10px 28px rgba(0, 0, 0, 0.16);
    backdrop-filter: blur(10px);
    animation: hys-mobile-nav-enter 400ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .hys-mobile-nav__item {
    display: flex;
    min-height: 54px;
    align-items: center;
    justify-content: center;
    border: 2px solid transparent;
    color: #5f6567;
    font: 900 13px/1.1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    letter-spacing: 0;
    text-decoration: none;
    transition:
      border-color 250ms cubic-bezier(0.22, 1, 0.36, 1),
      background-color 250ms cubic-bezier(0.22, 1, 0.36, 1),
      color 250ms cubic-bezier(0.22, 1, 0.36, 1),
      transform 250ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .hys-mobile-nav__item--active {
    border-color: #111;
    background: #111;
    color: #f4ecdc;
  }
  .hys-mobile-nav__item:focus-visible {
    outline: 2px solid #d82f2f;
    outline-offset: 2px;
  }
  .hys-mobile-nav__item:active {
    transform: translateY(1px);
  }
  @keyframes hys-mobile-nav-enter {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .hys-mobile-nav {
      animation: none !important;
    }
    .hys-mobile-nav__item {
      transition: none !important;
    }
  }
}
</style>
<nav class="hys-mobile-nav t-panel-reveal" data-hongyishi-mobile-nav data-hys-mobile-nav-scope="${escapeHtml(scope)}" aria-label="${escapeHtml(config.ariaLabel)}">${navItems}</nav>`;

  return content.replace(/<\/body>/i, `${nav}\n</body>`);
}

export function injectMobileHamburgerNav(
  content,
  activeTab = "tools",
  options = {},
) {
  if (
    !/<\/body>/i.test(content) ||
    /<[^>]+\bdata-hongyishi-mobile-menu\b/i.test(content)
  ) {
    return content;
  }

  const scope = options.scope ?? "platform";
  const config =
    options.config ?? mobileNavConfigs[scope] ?? mobileNavConfigs.platform;
  const basePath = options.basePath ?? "/";
  const menuId = `hys-mobile-top-menu-panel-${scope}`;
  const menuTabs = options.menuTabs ?? config.menuTabs ?? config.tabs;
  const tabs = menuTabs.map((tab) => ({
    ...tab,
    href: joinBasePath(basePath, tab.href),
  }));

  const menuItems = tabs
    .map((tab) => {
      const activeClass =
        tab.id === activeTab ? " hys-mobile-top-menu__link--active" : "";
      const ariaCurrent = tab.id === activeTab ? ' aria-current="page"' : "";
      const title = `${config.titlePrefix}${tab.label}`;
      return `<a class="hys-mobile-top-menu__link${activeClass}" href="${escapeHtml(tab.href)}"${ariaCurrent} title="${escapeHtml(title)}"><span>${escapeHtml(tab.label)}</span></a>`;
    })
    .join("");

  const styles = `
<style data-hongyishi-mobile-menu>
@media (min-width: 769px) {
  .hys-mobile-top-menu,
  .hys-mobile-top-menu__panel {
    display: none;
  }
}
@media (max-width: 768px) {
  .brand-nav {
    border-bottom-color: #12313c;
  }
  .brand-nav-inner {
    display: flex !important;
    width: min(100% - 32px, 1200px) !important;
    min-height: 78px !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 12px !important;
    padding: 14px 0 !important;
    border-bottom: 2px solid #12313c;
  }
  .brand-nav-links {
    display: none !important;
  }
  .brand-mark {
    min-width: 0;
    white-space: normal;
    font-size: clamp(1.15rem, 6.2vw, 1.8rem);
    line-height: 1.1;
  }
  .hys-mobile-top-menu {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 12px;
    margin-left: auto;
    position: static;
    z-index: 1;
  }
  .hys-mobile-top-menu__panel {
    width: min(100% - 32px, 1200px);
    margin: 0 auto;
    padding: 26px 0 26px;
    border-bottom: 2px solid #12313c;
    animation: hys-mobile-top-menu-enter 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .hys-mobile-top-menu__panel:not([hidden]) {
    display: grid;
    gap: 14px;
  }
  .hys-mobile-top-menu__panel[hidden] {
    display: none !important;
  }
  .hys-mobile-top-menu__link {
    display: flex;
    min-height: 60px;
    align-items: center;
    border: 0;
    color: #526569;
    font: 900 1.12rem/1.1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    letter-spacing: 0;
    padding: 0 28px;
    text-decoration: none;
  }
  .hys-mobile-top-menu__link--active {
    background: rgba(255, 255, 255, 0.64);
    box-shadow: inset 0 -4px 0 #d93025;
    color: #d93025;
  }
  .hys-mobile-top-menu__button,
  .hys-mobile-theme-toggle {
    display: inline-flex;
    width: 52px;
    min-width: 52px;
    min-height: 52px;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1.3rem;
    line-height: 1;
    transition:
      background-color 180ms cubic-bezier(0.22, 1, 0.36, 1),
      color 180ms cubic-bezier(0.22, 1, 0.36, 1),
      transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .hys-mobile-theme-toggle {
    background: transparent;
    color: #12313c;
  }
  .hys-mobile-top-menu__button {
    background: #78c7e7;
    color: #12313c;
  }
  .hys-mobile-top-menu__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .hys-mobile-top-menu__button [data-hys-menu-icon="close"],
  .hys-mobile-top-menu.is-open [data-hys-menu-icon="menu"],
  html[data-hys-theme="dark"] .hys-mobile-theme-toggle [data-hys-theme-icon="moon"],
  .hys-mobile-theme-toggle [data-hys-theme-icon="sun"] {
    display: none;
  }
  .hys-mobile-top-menu.is-open [data-hys-menu-icon="close"],
  html[data-hys-theme="dark"] .hys-mobile-theme-toggle [data-hys-theme-icon="sun"] {
    display: inline-block;
  }
  .hys-mobile-top-menu__button:focus-visible,
  .hys-mobile-top-menu__link:focus-visible,
  .hys-mobile-theme-toggle:focus-visible {
    outline: 2px solid #d93025;
    outline-offset: 2px;
  }
  .hys-mobile-top-menu__button:active,
  .hys-mobile-top-menu__link:active,
  .hys-mobile-theme-toggle:active {
    transform: translateY(1px);
  }
  html[data-hys-theme="dark"] body {
    background-color: #0f171a;
    background-image:
      linear-gradient(rgba(120, 199, 231, 0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(120, 199, 231, 0.06) 1px, transparent 1px);
    color: #f4ecdc;
  }
  html[data-hys-theme="dark"] .brand-nav {
    background: rgba(15, 23, 26, 0.98);
    border-bottom-color: #78c7e7;
  }
  html[data-hys-theme="dark"] .brand-nav-inner,
  html[data-hys-theme="dark"] .hys-mobile-top-menu__panel {
    border-color: #78c7e7;
  }
  html[data-hys-theme="dark"] .brand-mark,
  html[data-hys-theme="dark"] .hys-mobile-theme-toggle {
    color: #f4ecdc;
  }
  html[data-hys-theme="dark"] .brand-mark-red,
  html[data-hys-theme="dark"] .hys-mobile-top-menu__link--active {
    color: #ff6b00;
  }
  html[data-hys-theme="dark"] .brand-mark-divider,
  html[data-hys-theme="dark"] .hys-mobile-top-menu__link {
    color: #a9c3c8;
  }
  html[data-hys-theme="dark"] .hys-mobile-top-menu__link--active {
    background: rgba(244, 236, 220, 0.08);
    box-shadow: inset 0 -4px 0 #ff6b00;
  }
  html[data-hys-theme="dark"] .hys-mobile-top-menu__button {
    background: #78c7e7;
    color: #0f171a;
  }
  html[data-hys-theme="dark"] .hys-mobile-nav {
    border-top-color: #78c7e7;
    background: rgba(15, 23, 26, 0.96);
  }
  html[data-hys-theme="dark"] .hys-mobile-nav__item {
    color: #a9c3c8;
  }
  html[data-hys-theme="dark"] .hys-mobile-nav__item--active {
    border-color: #78c7e7;
    background: #78c7e7;
    color: #0f171a;
  }
  @keyframes hys-mobile-top-menu-enter {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .hys-mobile-top-menu {
      animation: none !important;
    }
    .hys-mobile-top-menu__button,
    .hys-mobile-top-menu__link {
      transition: none !important;
    }
  }
}
</style>
`;
  const controls = `<div class="hys-mobile-top-menu t-panel-reveal" data-hongyishi-mobile-menu data-hys-mobile-menu-scope="${escapeHtml(scope)}" aria-label="${escapeHtml(config.ariaLabel)}">
  <button class="hys-mobile-theme-toggle" type="button" aria-label="切换热射病日间夜间模式" data-hys-theme-toggle>
    <i class="fa-regular fa-moon" data-hys-theme-icon="moon" aria-hidden="true"></i>
    <i class="fa-regular fa-sun" data-hys-theme-icon="sun" aria-hidden="true"></i>
  </button>
  <button class="hys-mobile-top-menu__button" type="button" aria-label="打开${escapeHtml(config.ariaLabel)}菜单" aria-expanded="false" aria-controls="${escapeHtml(menuId)}" data-hys-mobile-menu-toggle>
    <span class="hys-mobile-top-menu__icon" aria-hidden="true">
      <i class="fa-solid fa-bars" data-hys-menu-icon="menu"></i>
      <i class="fa-solid fa-xmark" data-hys-menu-icon="close"></i>
    </span>
  </button>
</div>`;
  const panel = `<div class="hys-mobile-top-menu__panel" id="${escapeHtml(menuId)}" data-hys-mobile-menu-panel hidden>${menuItems}</div>`;
  const script = `
<script data-hongyishi-mobile-menu>
(() => {
  const nav = document.querySelector('[data-hongyishi-mobile-menu][data-hys-mobile-menu-scope="${escapeHtml(scope)}"]');
  const button = nav?.querySelector('[data-hys-mobile-menu-toggle]');
  const panel = document.getElementById('${escapeHtml(menuId)}');
  const themeButton = nav?.querySelector('[data-hys-theme-toggle]');
  const root = document.documentElement;
  const storageKey = 'hys:heatStroke:theme';
  if (!nav || !button || !panel) return;

  const setOpen = (isOpen) => {
    nav.classList.toggle('is-open', isOpen);
    nav.closest('.brand-nav')?.classList.toggle('hys-mobile-menu-open', isOpen);
    button.setAttribute('aria-expanded', String(isOpen));
    panel.hidden = !isOpen;
  };
  const getPreferredTheme = () => {
    try {
      const stored = localStorage.getItem(storageKey) || localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {}
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };
  const applyTheme = (theme) => {
    root.dataset.hysTheme = theme;
    root.classList.toggle('dark', theme === 'dark');
    themeButton?.setAttribute('aria-label', theme === 'dark' ? '切换热射病日间模式' : '切换热射病夜间模式');
    try {
      localStorage.setItem(storageKey, theme);
    } catch {}
  };

  applyTheme(getPreferredTheme());

  button.addEventListener('click', () => {
    setOpen(!nav.classList.contains('is-open'));
  });
  panel.addEventListener('click', (event) => {
    if (event.target.closest('a[href]')) setOpen(false);
  });
  themeButton?.addEventListener('click', (event) => {
    root.style.setProperty('--x', event.clientX + 'px');
    root.style.setProperty('--y', event.clientY + 'px');
    const nextTheme = root.dataset.hysTheme === 'dark' ? 'light' : 'dark';
    if (document.startViewTransition) {
      document.startViewTransition(() => applyTheme(nextTheme));
    } else {
      applyTheme(nextTheme);
    }
  });
  document.addEventListener('click', (event) => {
    if (!nav.contains(event.target) && !panel.contains(event.target)) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });
})();
</script>`;

  let output = content;
  if (/<\/head>/i.test(output)) {
    output = output.replace(/<\/head>/i, `${styles}\n</head>`);
  }

  const navPattern =
    /(<nav\b[^>]*class=["'][^"']*\bbrand-nav-inner\b[^"']*["'][^>]*>[\s\S]*?)(<\/nav>)(\s*<\/header>)/i;
  if (navPattern.test(output)) {
    output = output.replace(navPattern, `$1${controls}\n$2\n${panel}$3`);
  } else {
    const fallback = `${/<\/head>/i.test(content) ? "" : styles}\n${controls}\n${panel}`;
    output = output.replace(/<\/body>/i, `${fallback}\n</body>`);
  }

  return output.replace(/<\/body>/i, `${script}\n</body>`);
}

function extractHtmlTitle(content, fallbackTitle) {
  const titleMatch = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const bodyWithoutScripts = content.replace(
    /<script\b[\s\S]*?<\/script>/gi,
    "",
  );
  const h1Match = bodyWithoutScripts.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const rawTitle = titleMatch?.[1] ?? h1Match?.[1] ?? fallbackTitle;

  return (
    rawTitle
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\s*\|\s*TCCC.*$/i, "")
      .trim() || fallbackTitle
  );
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function injectContentGovernanceBanner(content, config) {
  if (
    !/<\/head>/i.test(content) ||
    !/<body\b[^>]*>/i.test(content) ||
    content.includes("data-hongyishi-content-governance")
  ) {
    return content;
  }

  const style = `
    <style data-hongyishi-content-governance>
      .hys-content-governance {
        border-bottom: 2px solid #111;
        background: #fff8e8;
        color: #111;
        font: 700 13px/1.5 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      }
      .hys-content-governance__inner {
        max-width: 1120px;
        margin: 0 auto;
        padding: 0.75rem 1rem;
        display: grid;
        gap: 0.35rem;
      }
      .hys-content-governance__status {
        display: inline-flex;
        width: fit-content;
        border: 2px solid #d93025;
        background: #d93025;
        color: #fff;
        padding: 0.1rem 0.45rem;
        font-weight: 900;
      }
      .hys-content-governance__meta {
        color: #4d4d4d;
      }
      .hys-content-governance a {
        color: #12313c;
        font-weight: 900;
        text-decoration: underline;
      }
      @media (max-width: 640px) {
        .hys-content-governance {
          font-size: 11px;
          line-height: 1.35;
        }
        .hys-content-governance__inner {
          align-items: center;
          gap: 0.25rem 0.5rem;
          grid-template-columns: auto minmax(0, 1fr);
          padding: 0.5rem 0.75rem;
        }
        .hys-content-governance__status {
          font-size: 10px;
          padding: 0.05rem 0.35rem;
          white-space: nowrap;
        }
        .hys-content-governance__meta {
          grid-column: 1 / -1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    </style>`;
  const officialLink = config.officialUpdateUrl
    ? ` <a href="${escapeHtml(config.officialUpdateUrl)}" rel="noopener noreferrer">官方更新源</a>`
    : "";
  const banner = `
    <aside class="hys-content-governance" data-hongyishi-content-governance aria-label="内容审核状态">
      <div class="hys-content-governance__inner">
        <span class="hys-content-governance__status">内容状态：${escapeHtml(config.statusLabel)}</span>
        <span>${escapeHtml(config.label)} · ${escapeHtml(config.disclaimer)}</span>
        <span class="hys-content-governance__meta">来源：${escapeHtml(config.sourceName)} · 版本：${escapeHtml(config.version)} · 复核日期：${escapeHtml(config.reviewedAt)}.${officialLink}</span>
      </div>
    </aside>`;

  return content
    .replace(/<\/head>/i, `${style}\n</head>`)
    .replace(/<body\b([^>]*)>/i, `<body$1>${banner}`);
}

export function injectTcccBrandShell(content, relativePath) {
  const normalizedPath = relativePath.split(path.sep).join("/");

  if (
    !normalizedPath.startsWith("pages/") ||
    !normalizedPath.endsWith(".html")
  ) {
    return content;
  }

  if (
    !/<\/head>/i.test(content) ||
    !/<body\b[^>]*>/i.test(content) ||
    content.includes("data-hongyishi-tccc-shell")
  ) {
    return content;
  }

  const flowTitle = escapeHtml(extractHtmlTitle(content, "TCCC 流程"));
  const style = `
    <style data-hongyishi-tccc-shell>
      .hys-tccc-skip {
        position: fixed;
        left: 1rem;
        top: 1rem;
        z-index: 2147483001;
        transform: translateY(-150%);
        background: #f4ecdc;
        color: #111;
        border: 2px solid #d93025;
        padding: 0.5rem 0.75rem;
        font-weight: 800;
        text-decoration: none;
      }
      .hys-tccc-skip:focus {
        transform: translateY(0);
      }
      .hys-tccc-shell {
        position: sticky;
        top: 0;
        z-index: 60;
        border-bottom: 2px solid #d93025;
        background: rgba(244, 236, 220, 0.97);
        color: #12313c;
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.28);
      }
      .hys-tccc-shell__inner {
        max-width: 1120px;
        margin: 0 auto;
        padding: 0.75rem 1rem;
        display: grid;
        gap: 0.5rem;
      }
      .hys-tccc-shell__nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
      }
      .hys-tccc-shell__brand {
        color: #d93025;
        font-weight: 900;
        text-decoration: none;
      }
      .hys-tccc-shell__links {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 0.5rem;
      }
      .hys-tccc-shell__links a {
        min-height: 36px;
        display: inline-flex;
        align-items: center;
        border: 2px solid #12313c;
        color: #12313c;
        padding: 0.35rem 0.6rem;
        font-size: 0.82rem;
        font-weight: 800;
        text-decoration: none;
      }
      .hys-tccc-shell__meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem 1rem;
        font-size: 0.78rem;
        color: #49606a;
      }
      .hys-tccc-shell__title {
        color: #12313c;
        font-weight: 900;
      }
      #hys-tccc-main {
        scroll-margin-top: 92px;
      }
      @media (max-width: 640px) {
        .hys-tccc-shell__nav {
          align-items: flex-start;
          flex-direction: column;
        }
        .hys-tccc-shell__links {
          justify-content: flex-start;
        }
      }
    </style>`;
  const shell = `
    <a class="hys-tccc-skip" href="#hys-tccc-main">跳到流程</a>
    <header class="hys-tccc-shell" data-hongyishi-tccc-shell>
      <div class="hys-tccc-shell__inner">
        <div class="hys-tccc-shell__nav">
          <a class="hys-tccc-shell__brand" href="/">红医师 / 战场救护</a>
          <div class="hys-tccc-shell__links" aria-label="TCCC 导航">
            <a href="/">总入口</a>
            <a href="/tccc/">项目首页</a>
          </div>
        </div>
        <div class="hys-tccc-shell__meta">
          <span class="hys-tccc-shell__title">当前流程：${flowTitle}</span>
          <span>教育训练用途</span>
          <span>内容状态：待复核</span>
          <span>CoTCCC 2017 基础内容，需按 JTS / Deployed Medicine 更新复核</span>
        </div>
      </div>
    </header>
    <div id="hys-tccc-main" tabindex="-1"></div>`;

  return content
    .replace(/<\/head>/i, `${style}\n</head>`)
    .replace(/<body\b([^>]*)>/i, `<body$1>${shell}`);
}

function rewriteHeatStrokePageAliases(content) {
  return rewritePageAliases(content, heatStrokePageAliases);
}

function rewriteTcccPageAliases(content) {
  return rewritePageAliases(content, tcccPageAliases);
}

export function rewriteHeatStrokeText(content, relativePath, basePath) {
  const base = normalizeBasePath(basePath);
  const normalizedPath = relativePath.split(path.sep).join("/");
  const aliasedContent = rewriteHeatStrokePageAliases(content);

  if (normalizedPath === "manifest.json") {
    const manifest = JSON.parse(aliasedContent);
    manifest.start_url = base;
    manifest.scope = base;
    manifest.icons = Array.isArray(manifest.icons)
      ? manifest.icons.map((icon) => ({
          ...icon,
          src:
            typeof icon.src === "string"
              ? icon.src.replace(/^\//, "")
              : icon.src,
        }))
      : manifest.icons;
    return `${JSON.stringify(manifest, null, 2)}\n`;
  }

  let output = aliasedContent
    .replace(/\b(href|src)=(["'])\/(assets|pages)\//g, `$1=$2${base}$3/`)
    .replace(/(["'`])\/(assets\/|pages\/)/g, `$1${base}$2`)
    .replace(/url\((["']?)\/(assets|pages)\//g, `url($1${base}$2/`)
    .replace(
      /navigator\.serviceWorker\.register\((["'])\/sw\.js\1\)/g,
      `navigator.serviceWorker.register('${base}sw.js', { scope: '${base}' })`,
    );

  if (normalizedPath === "sw.js") {
    output = output
      .replace(/(["'`])\/(["'`])/g, `$1${base}$2`)
      .replace(
        /(["'`])\/(index\.html|manifest\.json|assets\/|pages\/)/g,
        `$1${base}$2`,
      );
  }

  output = rewritePageHrefExtensions(output);

  if (normalizedPath.endsWith(".html")) {
    output = injectContentGovernanceBanner(
      output,
      contentGovernance.heatStroke,
    );
    output = injectMobileBottomNav(
      output,
      resolveProjectMobileActiveTab(
        "heatStroke",
        mapHeatStrokeOutputPath(normalizedPath),
      ),
      {
        scope: "heatStroke",
        basePath: base,
      },
    );
    output = injectMobileHamburgerNav(
      output,
      resolveHeatStrokeMenuActiveItem(mapHeatStrokeOutputPath(normalizedPath)),
      {
        scope: "heatStroke",
        basePath: base,
      },
    );
  }

  return output;
}

export function rewriteTcccText(content, relativePath, basePath) {
  const base = normalizeBasePath(basePath);
  const normalizedPath = relativePath.split(path.sep).join("/");
  const aliasedContent = rewriteTcccPageAliases(content);

  if (normalizedPath === "manifest.json") {
    const manifest = JSON.parse(aliasedContent);
    manifest.start_url = base;
    manifest.scope = base;
    manifest.icons = Array.isArray(manifest.icons)
      ? manifest.icons.map((icon) => ({
          ...icon,
          src:
            typeof icon.src === "string"
              ? icon.src.replace(/^\//, "")
              : icon.src,
        }))
      : manifest.icons;
    return `${JSON.stringify(manifest, null, 2)}\n`;
  }

  let output = aliasedContent
    .replace(
      /navigator\.serviceWorker\.register\((["'])\/sw\.js\1\)/g,
      `navigator.serviceWorker.register('${base}sw.js', { scope: '${base}' })`,
    )
    .replace(
      /\b(href|src)=(["'])\/(assets|icons|images|videos|pages)\//g,
      `$1=$2${base}$3/`,
    )
    .replace(
      /\b(href|src)=(["'])\/(manifest\.json|sw\.js|pwa-register\.js|offline\.html|README\.md|index\.html)/g,
      `$1=$2${base}$3`,
    )
    .replace(
      /(["'`])\/(assets\/|icons\/|images\/|videos\/|pages\/)/g,
      `$1${base}$2`,
    )
    .replace(
      /(["'`])\/(manifest\.json|sw\.js|pwa-register\.js|offline\.html|README\.md|index\.html)/g,
      `$1${base}$2`,
    )
    .replace(
      /url\((["']?)\/(assets|icons|images|videos|pages)\//g,
      `url($1${base}$2/`,
    );

  if (normalizedPath === "sw.js") {
    output = output
      .replace(/(["'`])\/(["'`])/g, `$1${base}$2`)
      .replace(
        /clients\.openWindow\((["'])\.\/\1\)/g,
        `clients.openWindow('${base}')`,
      );
  }

  output = rewritePageHrefExtensions(output);
  output = injectTcccBrandShell(output, normalizedPath);

  if (normalizedPath.endsWith(".html")) {
    output = injectContentGovernanceBanner(output, contentGovernance.tccc);
    output = injectMobileBottomNav(
      output,
      resolveProjectMobileActiveTab("tccc", mapTcccOutputPath(normalizedPath)),
      {
        scope: "tccc",
        basePath: base,
      },
    );
  }

  return output;
}

async function copyHeatStrokeApp(srcDir, destDir, basePath) {
  async function copyEntry(currentDir) {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(currentDir, entry.name);
      const relativePath = path.relative(srcDir, absolutePath);

      if (entry.isDirectory()) {
        await copyEntry(absolutePath);
        continue;
      }

      if (!entry.isFile() || !shouldCopyHeatStrokePath(relativePath)) {
        continue;
      }

      const outputRelativePath = mapHeatStrokeOutputPath(relativePath);
      const outputPath = path.join(destDir, ...outputRelativePath.split("/"));
      await mkdir(path.dirname(outputPath), { recursive: true });

      if (isTextFile(relativePath)) {
        const sourceText = await readFile(absolutePath, "utf8");
        await writeFile(
          outputPath,
          rewriteHeatStrokeText(sourceText, relativePath, basePath),
        );
      } else {
        await cp(absolutePath, outputPath);
      }
    }
  }

  await copyEntry(srcDir);
}

async function copyTcccApp(srcDir, destDir, basePath) {
  async function copyEntry(currentDir) {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(currentDir, entry.name);
      const relativePath = path.relative(srcDir, absolutePath);

      if (entry.isDirectory()) {
        await copyEntry(absolutePath);
        continue;
      }

      if (!entry.isFile() || !shouldCopyTcccPath(relativePath)) {
        continue;
      }

      const outputRelativePath = mapTcccOutputPath(relativePath);
      const outputPath = path.join(destDir, ...outputRelativePath.split("/"));
      await mkdir(path.dirname(outputPath), { recursive: true });

      if (isTextFile(relativePath)) {
        const sourceText = await readFile(absolutePath, "utf8");
        await writeFile(
          outputPath,
          rewriteTcccText(sourceText, relativePath, basePath),
        );
      } else {
        await cp(absolutePath, outputPath);
      }
    }
  }

  await copyEntry(srcDir);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    env: { ...process.env, ...options.env },
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} exited with status ${result.status}`,
    );
  }
}

async function assertDirectoryExists(directory) {
  const directoryStat = await stat(directory);
  if (!directoryStat.isDirectory()) {
    throw new Error(`${directory} is not a directory`);
  }
}

export async function collectCloudflareFreeTierStats(directory) {
  const rootDir = path.resolve(directory);
  const stats = {
    rootDir,
    fileCount: 0,
    totalBytes: 0,
    largestFile: {
      relativePath: "",
      bytes: 0,
    },
  };

  async function walk(currentDir) {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const fileStat = await stat(absolutePath);
      const relativePath = path
        .relative(rootDir, absolutePath)
        .split(path.sep)
        .join("/");

      stats.fileCount += 1;
      stats.totalBytes += fileStat.size;

      if (fileStat.size > stats.largestFile.bytes) {
        stats.largestFile = {
          relativePath,
          bytes: fileStat.size,
        };
      }
    }
  }

  await walk(rootDir);
  return stats;
}

export async function validateCloudflareFreeTierBudget(
  directory,
  limits = CLOUDFLARE_FREE_TIER_LIMITS,
) {
  const stats = await collectCloudflareFreeTierStats(directory);

  if (stats.fileCount > limits.maxFiles) {
    throw new Error(
      `${directory} contains ${stats.fileCount} files, which exceeds Cloudflare Pages file count limit ${limits.maxFiles}`,
    );
  }

  if (stats.largestFile.bytes > limits.maxFileBytes) {
    throw new Error(
      `${stats.largestFile.relativePath} is ${stats.largestFile.bytes} bytes and exceeds Cloudflare Pages single-file limit ${limits.maxFileBytes}`,
    );
  }

  return stats;
}

export async function buildCloudflareSite({
  fmsBase = "/fms/",
  heatStrokeBase = "/heat-stroke/",
  tcccBase = "/tccc/",
  skipBuilds = false,
} = {}) {
  const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const outputDir = path.join(repoRoot, ".cloudflare", "site");
  const portalOutput = path.join(repoRoot, "apps", "portal", "out");
  const fmsOutput = path.join(repoRoot, "apps", "fms", "dist");
  const heatStrokeSource = path.join(repoRoot, "apps", "heat-stroke");
  const tcccSource = path.join(repoRoot, "apps", "tccc");

  if (!skipBuilds) {
    run(pnpm, ["--filter", "@hongyishi/portal", "build:cf"]);
    run(pnpm, ["--filter", "@hongyishi/fms", "build"], {
      env: { VITE_BASE_PATH: normalizeBasePath(fmsBase) },
    });
    run(pnpm, ["--filter", "@hongyishi/heat-stroke", "build"]);
    run(pnpm, ["--filter", "@hongyishi/tccc", "build"]);
  }

  await assertDirectoryExists(portalOutput);
  await assertDirectoryExists(fmsOutput);
  await assertDirectoryExists(heatStrokeSource);
  await assertDirectoryExists(tcccSource);

  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  await cp(portalOutput, outputDir, { recursive: true });
  await cp(
    fmsOutput,
    path.join(outputDir, normalizeBasePath(fmsBase).replace(/^\/|\/$/g, "")),
    {
      recursive: true,
    },
  );
  await copyFile(
    path.join(
      outputDir,
      normalizeBasePath(fmsBase).replace(/^\/|\/$/g, ""),
      "index.html",
    ),
    path.join(
      outputDir,
      normalizeBasePath(fmsBase).replace(/^\/|\/$/g, ""),
      "404.html",
    ),
  );
  await copyHeatStrokeApp(
    heatStrokeSource,
    path.join(
      outputDir,
      normalizeBasePath(heatStrokeBase).replace(/^\/|\/$/g, ""),
    ),
    heatStrokeBase,
  );
  await copyTcccApp(
    tcccSource,
    path.join(outputDir, normalizeBasePath(tcccBase).replace(/^\/|\/$/g, "")),
    tcccBase,
  );
  await writeFile(
    path.join(outputDir, "_redirects"),
    buildRedirects({ fmsBase, heatStrokeBase, tcccBase }),
  );
  await writeFile(
    path.join(outputDir, "_headers"),
    buildHeaders({ fmsBase, heatStrokeBase, tcccBase }),
  );
  await validateCloudflareFreeTierBudget(outputDir);

  return outputDir;
}

const isCliRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCliRun) {
  buildCloudflareSite().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
