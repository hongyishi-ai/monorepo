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

export const usageGuideConfigs = {
  heatStroke: {
    default: {
      title: "热射病防治使用引导",
      summary: "先判断风险，再选择工具或资料页。",
      steps: [
        "需要现场决策时，优先进入热指数查询或现场处置。",
        "需要培训复盘时，查看 8-4-6 黄金法则和指南资料。",
        "所有建议都应结合现场指挥、降温条件和医疗转运能力。",
      ],
      boundary: "仅供训练和现场处置参考，不替代急救指挥、临床诊疗和当地规范。",
    },
    pages: {
      "pages/heat-index.html": {
        title: "热指数查询使用引导",
        summary: "输入环境信息后，按风险等级决定训练调整。",
        steps: [
          "优先使用定位或手动输入温湿度，确认数据来源可靠。",
          "查看热指数分级和页面建议，不要只看单个数字。",
          "高风险时减少强度、补水降温，并准备现场处置预案。",
        ],
        boundary: "热指数是风险评估工具，不能替代现场医学判断和指挥决策。",
      },
      "pages/field-treatment.html": {
        title: "现场处置使用引导",
        summary: "识别、降温、计时、转运要并行推进。",
        steps: [
          "先识别意识、体温、皮肤和运动能力异常，尽快脱离热环境。",
          "立即启动主动降温并记录关键时间，倒计时只服务于处置节奏。",
          "持续复评并尽早联系转运，不能等页面流程完成才求助。",
        ],
        boundary: "疑似热射病是急症，页面不能替代急救指挥或医疗团队处置。",
      },
      "pages/8-4-6-rule.html": {
        title: "8-4-6 黄金法则使用引导",
        summary: "把预防、预警和救治拆成可执行检查表。",
        steps: [
          "训练前用预防条目检查环境、补水、着装和人员状态。",
          "训练中用预警条目观察异常信号，出现问题立即降负荷。",
          "救治阶段按流程协同降温、转运和记录，不靠记忆临场拼凑。",
        ],
        boundary: "法则用于训练组织和复盘，具体处置仍以现场规范为准。",
      },
      "pages/heat-tolerance.html": {
        title: "热耐力评估使用引导",
        summary: "按表单逐项填写，结果用于训练风险分层。",
        steps: [
          "逐项填写近期状态、训练负荷和热暴露相关信息。",
          "提交后查看分层解释，重点关注可调整的风险因素。",
          "高风险结果应转化为训练安排调整，而不是继续硬撑。",
        ],
        boundary: "评估结果不是诊断，异常症状应优先由专业人员判断。",
      },
    },
  },
  tccc: {
    default: {
      title: "TCCC 使用引导",
      summary: "先明确场景，再按流程节点推进。",
      steps: [
        "确认当前页面属于 TFC、TCCC 还是 TACEVAC 场景。",
        "按页面决策节点执行，不要跳过出血、气道、呼吸、循环等优先级。",
        "流程学习后回到目录或标准流程，复核是否遗漏关键动作。",
      ],
      boundary:
        "仅供教育训练，不能替代现行作战医疗规范、医疗指挥链或正式认证课程。",
    },
    pages: {
      "pages/tccc-standard.html": {
        title: "TCCC 标准流程使用引导",
        summary: "按 MARCH/PAWS 思路复核关键处置。",
        steps: [
          "从威胁控制和大出血开始，不要先处理低优先级问题。",
          "每完成一个节点都回看下一步行动和撤离准备。",
          "学习完成后用目录进入专项算法做针对性训练。",
        ],
        boundary:
          "标准流程需按最新 CoTCCC/JTS 资料复核，本页面内容状态为待复核。",
      },
      "pages/tfc-hemorrhage.html": {
        title: "TFC 大出血算法使用引导",
        summary: "先控制可见大出血，再继续后续评估。",
        steps: [
          "快速定位肢体、交界区或躯干出血来源。",
          "按算法选择止血带、填塞、压迫或其他训练内容。",
          "完成止血后继续进入气道、呼吸和循环相关流程。",
        ],
        boundary: "算法用于训练演示，实际处置必须服从现行战术医疗规范。",
      },
      "pages/tacevac-reassessment.html": {
        title: "TACEVAC 再评估使用引导",
        summary: "转运阶段要持续复评，不是一次性检查。",
        steps: [
          "复查所有已完成处置是否仍然有效。",
          "记录生命体征、疼痛、低体温和交接信息。",
          "准备向接收方交代伤情、处置和后续风险。",
        ],
        boundary: "转运处置必须结合平台能力、医疗指挥和接收单位要求。",
      },
    },
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

export function resolveUsageGuideConfig(project, relativePath) {
  const normalized = relativePath.split(path.sep).join("/");
  const guideSet = usageGuideConfigs[project];

  if (!guideSet) {
    return undefined;
  }

  const outputPath =
    project === "heatStroke"
      ? mapHeatStrokeOutputPath(normalized)
      : project === "tccc"
        ? mapTcccOutputPath(normalized)
        : normalized;

  return guideSet.pages?.[outputPath] ?? guideSet.default;
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

function escapeScriptJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
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

function resolveUsageGuideTargets(project, relativePath) {
  const normalizedPath = relativePath.split(path.sep).join("/");
  const commonIntroTargets = [
    "[data-hongyishi-content-governance]",
    "header",
    "h1",
  ];
  const commonWorkTargets = [
    "main",
    "[role='main']",
    ".container",
    ".max-w-7xl",
    ".max-w-6xl",
    "section",
  ];
  const commonNavTargets = [
    "nav[data-hongyishi-mobile-nav]",
    "[data-hongyishi-content-governance]",
  ];

  if (
    project === "heatStroke" &&
    normalizedPath.endsWith("field-treatment.html")
  ) {
    return [
      commonIntroTargets,
      [
        "#countdown",
        "#timer",
        "[data-countdown]",
        ".countdown",
        ".timer",
        ...commonWorkTargets,
      ],
      commonNavTargets,
    ];
  }

  if (project === "tccc" && normalizedPath.startsWith("pages/")) {
    return [
      ["[data-hongyishi-tccc-shell]", ...commonIntroTargets],
      [
        "#hys-tccc-main",
        ".algorithm-container",
        ".flow-container",
        ".step-section",
        ...commonWorkTargets,
      ],
      commonNavTargets,
    ];
  }

  return [commonIntroTargets, commonWorkTargets, commonNavTargets];
}

export function injectUsageGuide(content, config, options = {}) {
  if (
    !config ||
    !/<\/head>/i.test(content) ||
    !/<body\b[^>]*>/i.test(content) ||
    content.includes("data-hongyishi-guide-runtime")
  ) {
    return content;
  }

  const project = options.project ?? "platform";
  const relativePath = options.relativePath ?? "index.html";
  const normalizedPath = relativePath.split(path.sep).join("/");
  const storageKey = `hys:${project}:guide:v1:${normalizedPath}:seen`;
  const targets = resolveUsageGuideTargets(project, normalizedPath);
  const guideConfig = {
    title: config.title,
    summary: config.summary,
    boundary: config.boundary,
    storageKey,
    steps: config.steps.map((step, index) => ({
      title:
        index === 0
          ? config.title
          : index === config.steps.length - 1
            ? "执行边界"
            : `第 ${index + 1} 步`,
      description: step,
      selectors: targets[index] ?? targets[targets.length - 1],
    })),
  };
  const style = `
    <style data-hongyishi-guide-runtime>
      .hys-guide-entry {
        max-width: 1120px;
        margin: 1rem auto;
        padding: 0 1rem;
        color: #12313c;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Noto Sans SC", sans-serif;
      }
      .hys-guide-entry__inner {
        border: 2px solid #111;
        background: #f4ecdc;
        box-shadow: 6px 6px 0 rgba(18, 49, 60, 0.22);
        padding: 0.75rem 1rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
      }
      .hys-guide-entry__copy {
        min-width: 0;
      }
      .hys-guide-entry__title {
        margin: 0;
        color: #111;
        font-weight: 900;
        line-height: 1.35;
      }
      .hys-guide-entry__summary {
        margin: 0.2rem 0 0;
        color: #4d4d4d;
        font-size: 0.9rem;
        font-weight: 700;
        line-height: 1.45;
      }
      .hys-guide-entry__button,
      .hys-guide-card__button {
        appearance: none;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #d93025;
        background: #d93025;
        color: #fff;
        min-height: 40px;
        padding: 0.45rem 0.7rem;
        font: 900 0.78rem/1.1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        white-space: nowrap;
      }
      .hys-guide-entry__button:focus-visible,
      .hys-guide-card__button:focus-visible {
        outline: 2px solid #12313c;
        outline-offset: 2px;
      }
      .hys-guide-overlay[hidden] {
        display: none;
      }
      .hys-guide-overlay {
        position: fixed;
        inset: 0;
        z-index: 2147483002;
        color: #12313c;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Noto Sans SC", sans-serif;
      }
      .hys-guide-overlay__shade {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.52);
      }
      .hys-guide-spotlight {
        position: fixed;
        border: 2px solid rgba(244, 236, 220, 0.95);
        box-shadow: 0 0 0 4px rgba(217, 48, 37, 0.28), 0 18px 48px rgba(0, 0, 0, 0.36);
        pointer-events: none;
        transition:
          top 220ms cubic-bezier(0.22, 1, 0.36, 1),
          left 220ms cubic-bezier(0.22, 1, 0.36, 1),
          width 220ms cubic-bezier(0.22, 1, 0.36, 1),
          height 220ms cubic-bezier(0.22, 1, 0.36, 1);
      }
      .hys-guide-card {
        position: fixed;
        width: min(380px, calc(100vw - 32px));
        border: 2px solid #111;
        background: #f4ecdc;
        box-shadow: 8px 8px 0 rgba(17, 17, 17, 0.32);
        padding: 1rem;
        transition:
          top 220ms cubic-bezier(0.22, 1, 0.36, 1),
          left 220ms cubic-bezier(0.22, 1, 0.36, 1),
          opacity 180ms ease;
      }
      .hys-guide-card__meta {
        display: inline-flex;
        border: 2px solid #12313c;
        background: #12313c;
        color: #f4ecdc;
        padding: 0.1rem 0.45rem;
        font: 900 0.72rem/1.2 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      }
      .hys-guide-card__title {
        margin: 0.7rem 0 0;
        color: #111;
        font-size: 1.05rem;
        font-weight: 900;
        line-height: 1.35;
      }
      .hys-guide-card__description {
        margin: 0.45rem 0 0;
        color: #34464d;
        font-weight: 800;
        line-height: 1.55;
      }
      .hys-guide-card__boundary {
        margin: 0.7rem 0 0;
        border-top: 2px solid rgba(17, 17, 17, 0.25);
        padding-top: 0.65rem;
        color: #4d4d4d;
        font-size: 0.86rem;
        font-weight: 700;
        line-height: 1.5;
      }
      .hys-guide-card__actions {
        margin-top: 1rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
      }
      .hys-guide-card__nav {
        display: flex;
        gap: 0.5rem;
      }
      .hys-guide-card__button--ghost {
        border: 2px solid #12313c;
        background: transparent;
        color: #12313c;
      }
      @media (prefers-reduced-motion: reduce) {
        .hys-guide-card,
        .hys-guide-spotlight {
          transition: none !important;
        }
      }
      @media (max-width: 640px) {
        .hys-guide-entry {
          margin: 0.75rem auto calc(86px + env(safe-area-inset-bottom) + 1rem);
          padding: 0 0.75rem;
        }
        .hys-guide-entry__inner {
          align-items: flex-start;
          flex-direction: column;
        }
        .hys-guide-card {
          width: min(360px, calc(100vw - 24px));
          padding: 0.9rem;
        }
      }
    </style>`;
  const guide = `
    <section class="hys-guide-entry t-stagger" data-hongyishi-guide-entry aria-label="${escapeHtml(config.title)}">
      <div class="hys-guide-entry__inner">
        <div class="hys-guide-entry__copy">
          <p class="hys-guide-entry__title">${escapeHtml(config.title)}</p>
          <p class="hys-guide-entry__summary">${escapeHtml(config.summary)}</p>
        </div>
        <button class="hys-guide-entry__button" type="button" data-hongyishi-guide-trigger>使用引导</button>
      </div>
    </section>`;
  const script = `
    <script data-hongyishi-guide-runtime>
      (() => {
        const config = ${escapeScriptJson(guideConfig)};
        const root = document.createElement('div');
        root.className = 'hys-guide-overlay';
        root.hidden = true;
        root.setAttribute('data-hongyishi-guide-runtime', '');
        root.innerHTML = '<div class="hys-guide-overlay__shade" data-guide-close></div><div class="hys-guide-spotlight" aria-hidden="true"></div><section class="hys-guide-card" role="dialog" aria-modal="true" aria-live="polite"><span class="hys-guide-card__meta"></span><h2 class="hys-guide-card__title"></h2><p class="hys-guide-card__description"></p><p class="hys-guide-card__boundary"></p><div class="hys-guide-card__actions"><button class="hys-guide-card__button hys-guide-card__button--ghost" type="button" data-guide-skip>跳过</button><div class="hys-guide-card__nav"><button class="hys-guide-card__button hys-guide-card__button--ghost" type="button" data-guide-prev>上一步</button><button class="hys-guide-card__button" type="button" data-guide-next>下一步</button></div></div></section>';
        document.body.append(root);

        const card = root.querySelector('.hys-guide-card');
        const spotlight = root.querySelector('.hys-guide-spotlight');
        const meta = root.querySelector('.hys-guide-card__meta');
        const title = root.querySelector('.hys-guide-card__title');
        const description = root.querySelector('.hys-guide-card__description');
        const boundary = root.querySelector('.hys-guide-card__boundary');
        const previous = root.querySelector('[data-guide-prev]');
        const next = root.querySelector('[data-guide-next]');
        const skip = root.querySelector('[data-guide-skip]');
        let index = 0;
        let activeTarget = null;
        let raf = 0;
        let scrollTimer = 0;

        const canStore = () => {
          try {
            localStorage.setItem('__hys_guide_probe__', '1');
            localStorage.removeItem('__hys_guide_probe__');
            return true;
          } catch {
            return false;
          }
        };
        const storageAvailable = canStore();
        const hasSeen = () => storageAvailable && localStorage.getItem(config.storageKey) === 'true';
        const markSeen = () => {
          if (storageAvailable) localStorage.setItem(config.storageKey, 'true');
        };
        const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const isVisible = (element) => {
          if (!element) return false;
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        };
        const getTarget = (step) => {
          for (const selector of step.selectors || []) {
            const element = document.querySelector(selector);
            if (isVisible(element)) return element;
          }
          return null;
        };
        const getMobileNavTop = () => {
          const nav = document.querySelector('nav[data-hongyishi-mobile-nav]');
          if (!isVisible(nav)) return window.innerHeight;
          return nav.getBoundingClientRect().top;
        };
        const clamp = (value, min, max) => Math.max(min, Math.min(value, max));
        const measure = () => {
          if (!activeTarget) {
            spotlight.hidden = true;
            const cardRect = card.getBoundingClientRect();
            card.style.left = Math.max(12, (window.innerWidth - cardRect.width) / 2) + 'px';
            card.style.top = Math.max(12, (Math.min(window.innerHeight, getMobileNavTop()) - cardRect.height) / 2) + 'px';
            return;
          }

          const rect = activeTarget.getBoundingClientRect();
          const padding = 8;
          spotlight.hidden = false;
          spotlight.style.left = Math.max(8, rect.left - padding) + 'px';
          spotlight.style.top = Math.max(8, rect.top - padding) + 'px';
          spotlight.style.width = Math.max(24, rect.width + padding * 2) + 'px';
          spotlight.style.height = Math.max(24, rect.height + padding * 2) + 'px';

          const cardRect = card.getBoundingClientRect();
          const navTop = getMobileNavTop();
          const maxTop = Math.max(12, Math.min(window.innerHeight, navTop) - cardRect.height - 12);
          let top = rect.bottom + 14;
          if (top > maxTop) top = rect.top - cardRect.height - 14;
          top = clamp(top, 12, maxTop);
          const left = clamp(rect.left + (rect.width - cardRect.width) / 2, 12, window.innerWidth - cardRect.width - 12);
          card.style.left = left + 'px';
          card.style.top = top + 'px';
        };
        const scheduleMeasure = () => {
          if (raf) window.cancelAnimationFrame(raf);
          raf = window.requestAnimationFrame(() => {
            raf = 0;
            measure();
          });
        };
        const scrollToStep = () => {
          if (!activeTarget) {
            scheduleMeasure();
            return;
          }
          activeTarget.scrollIntoView({
            block: 'center',
            inline: 'center',
            behavior: prefersReducedMotion() ? 'auto' : 'smooth',
          });
          scheduleMeasure();
          if (scrollTimer) window.clearTimeout(scrollTimer);
          scrollTimer = window.setTimeout(scheduleMeasure, prefersReducedMotion() ? 0 : 360);
        };
        const render = () => {
          const step = config.steps[index];
          activeTarget = getTarget(step);
          meta.textContent = (index + 1) + ' / ' + config.steps.length;
          title.textContent = step.title;
          description.textContent = step.description;
          boundary.textContent = index === config.steps.length - 1 ? config.boundary : '';
          boundary.hidden = index !== config.steps.length - 1 || !config.boundary;
          previous.hidden = index === 0;
          next.textContent = index === config.steps.length - 1 ? '完成' : '下一步';
          scrollToStep();
        };
        const open = () => {
          index = 0;
          root.hidden = false;
          render();
          next.focus({ preventScroll: true });
          window.addEventListener('resize', scheduleMeasure);
          window.addEventListener('scroll', scheduleMeasure, { passive: true });
        };
        const close = () => {
          markSeen();
          root.hidden = true;
          activeTarget = null;
          window.removeEventListener('resize', scheduleMeasure);
          window.removeEventListener('scroll', scheduleMeasure);
          if (raf) window.cancelAnimationFrame(raf);
          if (scrollTimer) window.clearTimeout(scrollTimer);
          raf = 0;
          scrollTimer = 0;
        };

        document.querySelectorAll('[data-hongyishi-guide-trigger]').forEach((trigger) => {
          trigger.addEventListener('click', open);
        });
        root.querySelector('[data-guide-close]').addEventListener('click', close);
        skip.addEventListener('click', close);
        previous.addEventListener('click', () => {
          if (index > 0) {
            index -= 1;
            render();
          }
        });
        next.addEventListener('click', () => {
          if (index >= config.steps.length - 1) {
            close();
            return;
          }
          index += 1;
          render();
        });
        document.addEventListener('keydown', (event) => {
          if (root.hidden || event.key !== 'Escape') return;
          close();
        });
        if (!hasSeen()) {
          window.setTimeout(open, 700);
        }
      })();
    </script>`;

  return content
    .replace(/<\/head>/i, `${style}\n</head>`)
    .replace(
      /(<body\b[^>]*>(?:\s*<aside class="hys-content-governance"[\s\S]*?<\/aside>)?)/i,
      `$1${guide}`,
    )
    .replace(/<\/body>/i, `${script}\n</body>`);
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
    output = injectUsageGuide(
      output,
      resolveUsageGuideConfig("heatStroke", normalizedPath),
      {
        project: "heatStroke",
        relativePath: mapHeatStrokeOutputPath(normalizedPath),
      },
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
    output = injectUsageGuide(
      output,
      resolveUsageGuideConfig("tccc", normalizedPath),
      {
        project: "tccc",
        relativePath: mapTcccOutputPath(normalizedPath),
      },
    );
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
