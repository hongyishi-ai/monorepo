#!/usr/bin/env node

const defaultBaseUrl = "http://127.0.0.1:3021";
const args = new Set(process.argv.slice(2));
const baseArg = process.argv.find((arg) => arg.startsWith("--base="));
const baseUrl =
  (baseArg ? baseArg.split("=")[1] : process.env.HONGYISHI_AUDIT_BASE_URL) ??
  defaultBaseUrl;
const shouldCheckExternal = args.has("--external");
const shouldCheckMobileNav = !args.has("--no-mobile-nav");
const shouldCheckGuideSurfaces = !args.has("--no-usage-guides");

const representativeRoutes = [
  "/",
  "/blog",
  "/offline",
  "/heat-stroke/",
  "/heat-stroke/pages/field-treatment",
  "/heat-stroke/pages/heat-index",
  "/heat-stroke/pages/8-4-6-rule",
  "/tccc/",
  "/tccc/pages/tccc-standard",
  "/tccc/pages/tfc-airway",
  "/tccc/pages/tccc-flow-framework",
  "/fms/",
  "/fms/assessment",
  "/fms/history",
  "/fms/report",
  "/fms/training",
  "/fms/education",
  "/fms/about",
];

function normalizeUrl(value, currentPath = "/") {
  try {
    const url = new URL(value, new URL(currentPath, baseUrl));
    url.hash = "";
    return url;
  } catch {
    return null;
  }
}

function extractLinks(html, currentPath) {
  const links = [];
  const patterns = [
    /<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi,
    /<form\b[^>]*\baction\s*=\s*(["'])(.*?)\1/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html))) {
      const rawHref = match[2]?.trim();

      if (!rawHref || /^(javascript:|data:|tel:|mailto:)/i.test(rawHref)) {
        continue;
      }

      const url = normalizeUrl(rawHref, currentPath);
      if (url) {
        links.push(url);
      }
    }
  }

  return links;
}

function shouldIgnoreInternalPath(pathname) {
  return pathname.startsWith("/cdn-cgi/");
}

async function fetchPage(pathname) {
  const response = await fetch(new URL(pathname, baseUrl), {
    redirect: "follow",
  });
  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("text/html") ? await response.text() : "";

  return {
    body,
    contentType,
    finalUrl: response.url,
    ok: response.ok,
    status: response.status,
  };
}

async function crawlInternalLinks() {
  const origin = new URL(baseUrl).origin;
  const queue = ["/"];
  const visited = new Set();
  const checked = [];
  const external = new Map();

  while (queue.length > 0) {
    const pathname = queue.shift();

    if (!pathname || visited.has(pathname)) {
      continue;
    }

    visited.add(pathname);
    const result = await fetchPage(pathname);
    checked.push({
      path: pathname,
      status: result.status,
      finalUrl: result.finalUrl,
    });

    if (!result.ok || !result.contentType.includes("text/html")) {
      continue;
    }

    for (const url of extractLinks(result.body, pathname)) {
      if (url.origin === origin) {
        const nextPath = `${url.pathname}${url.search}`;

        if (
          !shouldIgnoreInternalPath(url.pathname) &&
          !visited.has(nextPath) &&
          !queue.includes(nextPath)
        ) {
          queue.push(nextPath);
        }
      } else if (shouldCheckExternal && /^https?:$/.test(url.protocol)) {
        const sourcePaths = external.get(url.href) ?? new Set();
        sourcePaths.add(pathname);
        external.set(url.href, sourcePaths);
      }
    }
  }

  const failures = checked.filter((item) => item.status >= 400);
  return { checked, external, failures, visited };
}

async function checkRepresentativeRoutes() {
  const results = [];

  for (const route of representativeRoutes) {
    try {
      const result = await fetchPage(route);
      results.push({
        path: route,
        status: result.status,
        finalUrl: result.finalUrl,
      });
    } catch (error) {
      results.push({ path: route, error: String(error) });
    }
  }

  return results;
}

async function checkExternalLinks(external) {
  const urls = Array.from(external.keys());
  const results = [];
  let index = 0;

  async function checkOne(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);

    try {
      let response = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal,
        headers: { "user-agent": "Mozilla/5.0 hongyishi-link-audit" },
      });

      if ([403, 405, 406].includes(response.status)) {
        response = await fetch(url, {
          method: "GET",
          redirect: "follow",
          signal: controller.signal,
          headers: {
            range: "bytes=0-1024",
            "user-agent": "Mozilla/5.0 hongyishi-link-audit",
          },
        });
      }

      return {
        url,
        status: response.status,
        ok:
          response.status < 400 ||
          [401, 403, 406, 429].includes(response.status),
      };
    } catch (error) {
      return {
        url,
        error: error.name === "AbortError" ? "timeout" : String(error),
        ok: false,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async function worker() {
    while (index < urls.length) {
      const url = urls[index];
      index += 1;
      results.push(await checkOne(url));
    }
  }

  await Promise.all(Array.from({ length: 6 }, worker));
  return results;
}

async function checkMobileNav() {
  if (!shouldCheckMobileNav) {
    return [];
  }

  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const routesToCheck = [
    {
      path: "/",
      requiredLabels: ["处置", "工具", "记录", "资料"],
    },
    {
      path: "/heat-stroke/",
      expectedScope: "heatStroke",
      linkBase: "/heat-stroke/",
      requiredHrefs: [
        "/heat-stroke/pages/heat-index",
        "/heat-stroke/pages/field-treatment",
        "/heat-stroke/pages/8-4-6-rule",
        "/heat-stroke/",
      ],
      expectedTopMenuHrefs: [
        "/",
        "/heat-stroke/",
        "/heat-stroke/pages/diagnosis-treatment-guideline",
        "/heat-stroke/pages/treatment-system-consensus",
        "/heat-stroke/pages/heat-tolerance",
        "/heat-stroke/pages/core-temperature-cooling",
        "/heat-stroke/pages/challenge",
        "/heat-stroke/pages/about",
      ],
      expectedTopMenuLabels: ["总入口", "项目首页", "诊断与治疗指南"],
    },
    {
      path: "/heat-stroke/pages/field-treatment",
      expectedScope: "heatStroke",
      linkBase: "/heat-stroke/",
      requiredHrefs: [
        "/heat-stroke/pages/heat-index",
        "/heat-stroke/pages/field-treatment",
        "/heat-stroke/pages/8-4-6-rule",
        "/heat-stroke/",
      ],
      expectedTopMenuHrefs: [
        "/",
        "/heat-stroke/",
        "/heat-stroke/pages/diagnosis-treatment-guideline",
        "/heat-stroke/pages/treatment-system-consensus",
        "/heat-stroke/pages/heat-tolerance",
        "/heat-stroke/pages/core-temperature-cooling",
        "/heat-stroke/pages/challenge",
        "/heat-stroke/pages/about",
      ],
      expectedTopMenuLabels: ["总入口", "项目首页", "诊断与治疗指南"],
    },
    {
      path: "/tccc/",
      expectedScope: "tccc",
      linkBase: "/tccc/",
      requiredHrefs: [
        "/tccc/pages/tccc-standard",
        "/tccc/pages/tfc-hemorrhage",
        "/tccc/pages/tacevac-reassessment",
        "/tccc/",
      ],
    },
    {
      path: "/tccc/pages/tccc-standard",
      expectedScope: "tccc",
      linkBase: "/tccc/",
      requiredHrefs: [
        "/tccc/pages/tccc-standard",
        "/tccc/pages/tfc-hemorrhage",
        "/tccc/pages/tacevac-reassessment",
        "/tccc/",
      ],
    },
    {
      path: "/fms/assessment",
      expectedScope: "fms",
      linkBase: "/fms/",
      requiredHrefs: [
        "/fms",
        "/fms/assessment",
        "/fms/training",
        "/fms/history",
      ],
    },
  ];
  const results = [];

  try {
    for (const expectation of routesToCheck) {
      await page.goto(new URL(expectation.path, baseUrl).href, {
        waitUntil: "domcontentloaded",
        timeout: 15_000,
      });
      await page.waitForTimeout(300);
      results.push(
        await page.evaluate((expected) => {
          const nav = document.querySelector(
            'nav[data-hongyishi-mobile-nav], nav[aria-label="红医师移动端导航"]',
          );
          const style = nav ? getComputedStyle(nav) : null;
          const hrefs = nav
            ? Array.from(nav.querySelectorAll("a[href]")).map((link) => {
                const url = new URL(
                  link.getAttribute("href"),
                  window.location.href,
                );
                return `${url.pathname}${url.search}`;
              })
            : [];
          const labels = nav
            ? Array.from(nav.querySelectorAll("a[href], button")).map(
                (item) => item.textContent?.replace(/\s+/g, " ").trim() ?? "",
              )
            : [];
          const linkBaseRoot = expected.linkBase?.replace(/\/$/, "");
          const outOfScopeLinks = expected.linkBase
            ? hrefs.filter(
                (href) =>
                  href.startsWith("/") &&
                  !href.startsWith(expected.linkBase) &&
                  href !== linkBaseRoot,
              )
            : [];
          const missingRequiredHrefs = (expected.requiredHrefs ?? []).filter(
            (href) => !hrefs.includes(href),
          );
          const missingRequiredLabels = (expected.requiredLabels ?? []).filter(
            (label) => !labels.includes(label),
          );
          const topMenu = document.querySelector(
            "[data-hongyishi-mobile-menu][data-hys-mobile-menu-scope]",
          );
          const topMenuStyle = topMenu ? getComputedStyle(topMenu) : null;
          const topMenuButton = topMenu?.querySelector(
            "[data-hys-mobile-menu-toggle]",
          );
          const topMenuPanelId = topMenuButton?.getAttribute("aria-controls");
          const topMenuPanel = topMenuPanelId
            ? document.getElementById(topMenuPanelId)
            : null;
          const topMenuLinkRoots = [topMenu, topMenuPanel].filter(Boolean);
          const topMenuHrefs = topMenu
            ? topMenuLinkRoots.flatMap((root) =>
                Array.from(root.querySelectorAll("a[href]")).map((link) => {
                  const url = new URL(
                    link.getAttribute("href"),
                    window.location.href,
                  );
                  return `${url.pathname}${url.search}`;
                }),
              )
            : [];
          const topMenuLabels = topMenu
            ? topMenuLinkRoots.flatMap((root) =>
                Array.from(root.querySelectorAll("a[href]")).map(
                  (item) => item.textContent?.replace(/\s+/g, " ").trim() ?? "",
                ),
              )
            : [];
          const visibleBrandNavLinks = Array.from(
            document.querySelectorAll(".brand-nav-links"),
          ).filter((element) => {
            const elementStyle = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return (
              elementStyle.display !== "none" &&
              elementStyle.visibility !== "hidden" &&
              rect.width > 0 &&
              rect.height > 0
            );
          }).length;
          const missingTopMenuHrefs = (
            expected.expectedTopMenuHrefs ?? []
          ).filter((href) => !topMenuHrefs.includes(href));
          const missingTopMenuLabels = (
            expected.expectedTopMenuLabels ?? []
          ).filter((label) => !topMenuLabels.includes(label));

          return {
            path: expected.path,
            hasNav: Boolean(nav),
            position: style?.position ?? "",
            scope: nav?.getAttribute("data-hys-mobile-nav-scope") ?? "",
            expectedScope: expected.expectedScope ?? "",
            hasMainSiteLabel: Boolean(nav?.textContent?.includes("主站")),
            missingRequiredHrefs,
            missingRequiredLabels,
            outOfScopeLinks,
            hasTopMenu: Boolean(topMenu),
            topMenuScope:
              topMenu?.getAttribute("data-hys-mobile-menu-scope") ?? "",
            topMenuPosition: topMenuStyle?.position ?? "",
            topMenuInBrandNav: Boolean(topMenu?.closest(".brand-nav")),
            hasTopMenuButton: Boolean(topMenuButton),
            hasThemeToggle: Boolean(
              topMenu?.querySelector("[data-hys-theme-toggle]"),
            ),
            visibleBrandNavLinks,
            missingTopMenuHrefs,
            missingTopMenuLabels,
            horizontalOverflow:
              document.documentElement.scrollWidth >
              document.documentElement.clientWidth + 2,
          };
        }, expectation),
      );
    }
  } finally {
    await browser.close();
  }

  return results;
}

async function checkGuideSurfaces() {
  if (!shouldCheckGuideSurfaces) {
    return [];
  }

  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const routesToCheck = [
    {
      path: "/fms/?skip_opening=true",
    },
    {
      path: "/fms/assessment",
      prepareAssessmentControls: true,
      checkAssistDock: true,
    },
    {
      path: "/fms/report",
    },
    {
      path: "/fms/training",
    },
    {
      path: "/fms/history",
    },
    {
      path: "/fms/education",
    },
    {
      path: "/fms/about",
    },
    {
      path: "/heat-stroke/",
    },
    {
      path: "/heat-stroke/pages/heat-index",
    },
    {
      path: "/heat-stroke/pages/field-treatment",
    },
    {
      path: "/heat-stroke/pages/8-4-6-rule",
    },
    {
      path: "/tccc/",
    },
    {
      path: "/tccc/pages/tccc-standard",
    },
    {
      path: "/tccc/pages/tfc-hemorrhage",
    },
    {
      path: "/tccc/pages/tacevac-reassessment",
    },
  ];
  const results = [];

  try {
    for (const expectation of routesToCheck) {
      await page.goto(new URL(expectation.path, baseUrl).href, {
        waitUntil: "domcontentloaded",
        timeout: 15_000,
      });
      await page.waitForTimeout(500);
      if (expectation.prepareAssessmentControls) {
        await page
          .locator('button[aria-label^="评分3分"]')
          .first()
          .click({ timeout: 5_000 })
          .catch(() => undefined);
        await page.waitForTimeout(300);
      }
      results.push(
        await page.evaluate((expected) => {
          const guideSelectors = [
            "[data-hys-fms-guide-panel]",
            "[data-hys-tour-help]",
            "[data-hongyishi-guide-runtime]",
            "[data-hongyishi-guide-trigger]",
            "[data-hongyishi-guide-entry]",
            ".hys-guide-panel",
            ".hys-guide-shell-button",
            ".hys-guide-entry",
            ".hys-guide-card",
          ];
          const guideSurfaces = guideSelectors
            .flatMap((selector) =>
              Array.from(document.querySelectorAll(selector)).map((item) => ({
                selector,
                text: item.textContent?.replace(/\s+/g, " ").trim() ?? "",
              })),
            )
            .filter((item) => item.text.length > 0 || item.selector !== "");
          const nav = document.querySelector(
            'nav[data-hongyishi-mobile-nav], nav[aria-label="训练伤防治项目移动端导航"]',
          );
          const navRect = nav?.getBoundingClientRect();
          const assistControls = expected.checkAssistDock
            ? Array.from(
                document.querySelectorAll("[data-hys-assist-control]"),
              ).map((item) => {
                const rect = item.getBoundingClientRect();
                return {
                  id: item.getAttribute("data-hys-assist-control") ?? "",
                  visible: rect.width > 0 && rect.height > 0,
                  bottom: rect.bottom,
                  navTop: navRect?.top ?? null,
                  overlapsNav: navRect
                    ? rect.left < navRect.right &&
                      rect.right > navRect.left &&
                      rect.top < navRect.bottom &&
                      rect.bottom > navRect.top + 1
                    : false,
                };
              })
            : [];

          return {
            path: expected.path,
            guideSurfaces,
            guideSurfaceCount: guideSurfaces.length,
            horizontalOverflow:
              document.documentElement.scrollWidth >
              document.documentElement.clientWidth + 2,
            assistControls,
          };
        }, expectation),
      );
    }
  } finally {
    await browser.close();
  }

  return results;
}

function summarizeStatus(items) {
  return items.reduce((summary, item) => {
    const key = item.status ?? item.error ?? "unknown";
    summary[key] = (summary[key] ?? 0) + 1;
    return summary;
  }, {});
}

const crawl = await crawlInternalLinks();
const representative = await checkRepresentativeRoutes();
const mobileNav = await checkMobileNav();
const guideSurfaces = await checkGuideSurfaces();
const externalResults = shouldCheckExternal
  ? await checkExternalLinks(crawl.external)
  : [];

const representativeFailures = representative.filter(
  (item) => item.error || item.status >= 400,
);
const mobileNavFailures = mobileNav.filter(
  (item) =>
    !item.hasNav ||
    item.position !== "fixed" ||
    item.horizontalOverflow ||
    item.hasMainSiteLabel ||
    item.missingRequiredHrefs.length > 0 ||
    item.missingRequiredLabels.length > 0 ||
    item.outOfScopeLinks.length > 0 ||
    (item.expectedScope && item.scope !== item.expectedScope) ||
    (item.expectedScope === "heatStroke" &&
      (!item.hasTopMenu ||
        item.topMenuScope !== "heatStroke" ||
        item.topMenuPosition === "fixed" ||
        !item.topMenuInBrandNav ||
        !item.hasTopMenuButton ||
        !item.hasThemeToggle ||
        item.visibleBrandNavLinks > 0 ||
        item.missingTopMenuHrefs.length > 0 ||
        item.missingTopMenuLabels.length > 0)),
);
const guideSurfaceFailures = guideSurfaces.filter(
  (item) =>
    item.guideSurfaceCount > 0 ||
    item.horizontalOverflow ||
    (item.assistControls.length > 0 &&
      !["demo", "status"].every((id) =>
        item.assistControls.some((control) => control.id === id),
      )) ||
    item.assistControls.some(
      (control) => !control.visible || control.overlapsNav,
    ),
);
const externalFailures = externalResults.filter((item) => !item.ok);
const failed =
  crawl.failures.length > 0 ||
  representativeFailures.length > 0 ||
  mobileNavFailures.length > 0 ||
  guideSurfaceFailures.length > 0 ||
  externalFailures.length > 0;

const report = {
  baseUrl,
  internal: {
    checked: crawl.checked.length,
    byStatus: summarizeStatus(crawl.checked),
    failures: crawl.failures,
  },
  representative: {
    checked: representative.length,
    byStatus: summarizeStatus(representative),
    failures: representativeFailures,
  },
  mobileNav: {
    checked: mobileNav.length,
    failures: mobileNavFailures,
  },
  guideSurfaces: {
    checked: guideSurfaces.length,
    failures: guideSurfaceFailures,
  },
  external: shouldCheckExternal
    ? {
        checked: externalResults.length,
        byStatus: summarizeStatus(externalResults),
        failures: externalFailures.map((item) => ({
          ...item,
          from: Array.from(crawl.external.get(item.url) ?? []).slice(0, 3),
        })),
      }
    : "skipped",
};

console.log(JSON.stringify(report, null, 2));

if (failed) {
  process.exitCode = 1;
}
