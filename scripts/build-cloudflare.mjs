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

export function injectThemeRuntime(content) {
  if (
    !/<\/head>/i.test(content) ||
    !/<\/body>/i.test(content) ||
    content.includes("data-hongyishi-theme-runtime")
  ) {
    return content;
  }

  const style = `
<style data-hongyishi-theme-runtime>
  :root {
    color-scheme: light;
  }
  html.dark {
    color-scheme: dark;
  }
  html.dark {
    --hys-paper: #050505;
    --hys-ink: #f4ecdc;
    --hys-field-navy: #f4ecdc;
    --hys-muted: #b8b0a2;
    --hys-clinical-blue: #78c7e7;
  }
  html.dark body {
    background-color: #050505 !important;
    color: #f4ecdc !important;
  }
  html.dark body,
  html.dark body.hys-heat-page {
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px) !important;
  }
  html.dark a {
    color: #78c7e7;
  }
  .hys-theme-control {
    position: fixed;
    top: max(12px, env(safe-area-inset-top));
    right: max(12px, env(safe-area-inset-right));
    z-index: 2147482999;
    display: grid;
    justify-items: end;
    gap: 6px;
    color: #111;
    font: 900 12px/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
  .hys-theme-control__trigger,
  .hys-theme-control__item {
    appearance: none;
    border: 2px solid currentColor;
    border-radius: 4px;
    color: inherit;
    cursor: pointer;
    font: inherit;
    letter-spacing: 0;
  }
  .hys-theme-control__trigger {
    min-height: 36px;
    background: rgba(244, 236, 220, 0.94);
    padding: 0 10px;
    box-shadow: 4px 4px 0 rgba(17, 17, 17, 0.18);
    backdrop-filter: blur(10px);
  }
  .hys-theme-control__menu {
    display: none;
    min-width: 132px;
    border: 2px solid currentColor;
    border-radius: 4px;
    background: rgba(244, 236, 220, 0.98);
    box-shadow: 8px 8px 0 rgba(17, 17, 17, 0.18);
    padding: 4px;
    backdrop-filter: blur(10px);
  }
  .hys-theme-control[data-open="true"] .hys-theme-control__menu {
    display: grid;
    gap: 3px;
  }
  .hys-theme-control__item {
    width: 100%;
    min-height: 34px;
    background: transparent;
    padding: 0 8px;
    text-align: left;
  }
  .hys-theme-control__item:hover,
  .hys-theme-control__item[aria-checked="true"] {
    background: currentColor;
    color: #f4ecdc;
  }
  .hys-theme-control__trigger:focus-visible,
  .hys-theme-control__item:focus-visible {
    outline: 2px solid #d93025;
    outline-offset: 2px;
  }
  html.dark .hys-theme-control {
    color: #f4ecdc;
  }
  html.dark .hys-theme-control__trigger,
  html.dark .hys-theme-control__menu {
    background: rgba(5, 5, 5, 0.92);
    box-shadow: 4px 4px 0 rgba(217, 48, 37, 0.36);
  }
  html.dark .hys-theme-control__item:hover,
  html.dark .hys-theme-control__item[aria-checked="true"] {
    color: #050505;
  }
  html.dark .hys-mobile-nav {
    border-top-color: #f4ecdc;
    background: rgba(5, 5, 5, 0.94);
    box-shadow: 0 -10px 28px rgba(0, 0, 0, 0.5);
  }
  html.dark .hys-mobile-nav__item {
    color: #b8b0a2;
  }
  html.dark .hys-mobile-nav__item--active {
    border-color: #f4ecdc;
    background: #f4ecdc;
    color: #050505;
  }
  html.dark .hys-content-governance {
    border-bottom-color: #d93025;
    background: #0b1418;
    color: #f4ecdc;
  }
  html.dark .hys-content-governance__meta {
    color: #b8b0a2;
  }
  html.dark .hys-content-governance a,
  html.dark .hys-tccc-shell__links a {
    color: #78c7e7;
  }
  html.dark .hys-tccc-shell,
  html.dark .brand-nav {
    background: rgba(5, 5, 5, 0.96) !important;
    color: #f4ecdc !important;
  }
  html.dark .hys-tccc-shell__brand,
  html.dark .hys-tccc-shell__title,
  html.dark .brand-mark,
  html.dark .brand-nav-link {
    color: #f4ecdc !important;
  }
  html.dark .hys-tccc-shell__meta {
    color: #b8b0a2;
  }
  html.dark .hys-tccc-shell__links a,
  html.dark .brand-nav-link {
    border-color: #f4ecdc !important;
  }
  @media (max-width: 640px) {
    .hys-theme-control__label {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }
    .hys-theme-control__trigger {
      min-width: 38px;
      padding: 0 8px;
    }
  }
</style>`;

  const script = `
<script data-hongyishi-theme-runtime>
(function () {
  var STORAGE_KEY = "hongyishi-theme";
  var LEGACY_KEYS = ["hongyishi-blog-theme", "theme"];
  var MODES = ["system", "light", "dark"];
  var LABELS = { system: "跟随系统", light: "日间", dark: "夜间" };
  var media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function isMode(value) {
    return MODES.indexOf(value) !== -1;
  }

  function readMode() {
    try {
      var stored = window.localStorage.getItem(STORAGE_KEY);
      if (isMode(stored)) return stored;
      for (var index = 0; index < LEGACY_KEYS.length; index += 1) {
        var legacyValue = window.localStorage.getItem(LEGACY_KEYS[index]);
        if (isMode(legacyValue)) {
          window.localStorage.setItem(STORAGE_KEY, legacyValue);
          return legacyValue;
        }
      }
    } catch (error) {
      return "system";
    }
    return "system";
  }

  function writeMode(mode) {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch (error) {}
  }

  function resolveMode(mode) {
    return mode === "system" ? (media && media.matches ? "dark" : "light") : mode;
  }

  function applyMode(mode) {
    var resolved = resolveMode(mode);
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.setAttribute("data-mode", mode);
    document.documentElement.setAttribute("data-hys-theme", mode);
    document.documentElement.setAttribute("data-hys-theme-resolved", resolved);
    document.querySelectorAll("[data-hongyishi-theme-control]").forEach(function (control) {
      var trigger = control.querySelector(".hys-theme-control__trigger");
      if (trigger) {
        trigger.setAttribute("aria-label", "主题：" + LABELS[mode]);
        var label = trigger.querySelector(".hys-theme-control__label");
        if (label) label.textContent = LABELS[mode];
      }
      control.querySelectorAll(".hys-theme-control__item").forEach(function (item) {
        var active = item.getAttribute("data-theme-mode") === mode;
        item.setAttribute("aria-checked", active ? "true" : "false");
      });
    });
  }

  function closeAll() {
    document.querySelectorAll("[data-hongyishi-theme-control]").forEach(function (control) {
      control.setAttribute("data-open", "false");
      var trigger = control.querySelector(".hys-theme-control__trigger");
      if (trigger) trigger.setAttribute("aria-expanded", "false");
    });
  }

  function bindControl(control) {
    var trigger = control.querySelector(".hys-theme-control__trigger");
    if (trigger) {
      trigger.addEventListener("click", function () {
        var open = control.getAttribute("data-open") === "true";
        closeAll();
        control.setAttribute("data-open", open ? "false" : "true");
        trigger.setAttribute("aria-expanded", open ? "false" : "true");
      });
    }
    control.querySelectorAll(".hys-theme-control__item").forEach(function (item) {
      item.addEventListener("click", function () {
        var mode = item.getAttribute("data-theme-mode");
        if (!isMode(mode)) return;
        writeMode(mode);
        applyMode(mode);
        closeAll();
      });
    });
  }

  function init() {
    document.querySelectorAll("[data-hongyishi-theme-control]").forEach(bindControl);
    applyMode(readMode());
    document.addEventListener("click", function (event) {
      if (!event.target.closest("[data-hongyishi-theme-control]")) closeAll();
    });
  }

  applyMode(readMode());
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  if (media && media.addEventListener) media.addEventListener("change", function () {
    if (readMode() === "system") applyMode("system");
  });
  window.addEventListener("storage", function (event) {
    if (event.key === STORAGE_KEY && isMode(event.newValue)) applyMode(event.newValue);
  });
})();
</script>`;

  const control = `
<div class="hys-theme-control" data-hongyishi-theme-control data-open="false">
  <button class="hys-theme-control__trigger" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="主题：跟随系统">◐ <span class="hys-theme-control__label">跟随系统</span></button>
  <div class="hys-theme-control__menu" role="menu" aria-label="选择主题">
    <button class="hys-theme-control__item" type="button" role="menuitemradio" data-theme-mode="system" aria-checked="true">跟随系统</button>
    <button class="hys-theme-control__item" type="button" role="menuitemradio" data-theme-mode="light" aria-checked="false">日间</button>
    <button class="hys-theme-control__item" type="button" role="menuitemradio" data-theme-mode="dark" aria-checked="false">夜间</button>
  </div>
</div>`;

  return content
    .replace(/<\/head>/i, `${style}\n</head>`)
    .replace(/<\/body>/i, `${control}\n${script}\n</body>`);
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
    output = injectThemeRuntime(output);
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
    output = injectThemeRuntime(output);
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
