import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { test } from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildHeaders,
  buildRedirects,
  CLOUDFLARE_FREE_TIER_LIMITS,
  collectCloudflareFreeTierStats,
  injectMobileBottomNav,
  injectContentGovernanceBanner,
  injectUsageGuide,
  injectTcccBrandShell,
  mapHeatStrokeOutputPath,
  mapTcccOutputPath,
  normalizeBasePath,
  resolveUsageGuideConfig,
  rewriteHeatStrokeText,
  rewriteTcccText,
  shouldCopyHeatStrokePath,
  shouldCopyTcccPath,
  validateCloudflareFreeTierBudget,
} from "./build-cloudflare.mjs";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const heatStrokePagesDir = path.join(repoRoot, "apps", "heat-stroke", "pages");
const heatStrokeScriptsDir = path.join(
  repoRoot,
  "apps",
  "heat-stroke",
  "assets",
  "js",
);
const fmsSrcDir = path.join(repoRoot, "apps", "fms", "src");
const tcccDir = path.join(repoRoot, "apps", "tccc");
const tcccPagesDir = path.join(tcccDir, "pages");

async function collectFiles(directory, extensions) {
  const files = [];
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath, extensions)));
      continue;
    }

    if (
      entry.isFile() &&
      extensions.some((extension) => entry.name.endsWith(extension))
    ) {
      files.push(absolutePath);
    }
  }

  return files;
}

test("normalizeBasePath enforces leading and trailing slashes", () => {
  assert.equal(normalizeBasePath("fms"), "/fms/");
  assert.equal(normalizeBasePath("/heat-stroke"), "/heat-stroke/");
  assert.equal(normalizeBasePath("tccc"), "/tccc/");
  assert.equal(normalizeBasePath("/"), "/");
});

test("buildRedirects contains the unified single-site routing rules", () => {
  const redirects = buildRedirects({
    fmsBase: "/fms/",
    heatStrokeBase: "/heat-stroke/",
    tcccBase: "/tccc/",
  });

  assert.match(redirects, /\/fms\s+\/fms\/\s+301/);
  assert.match(redirects, /\/heat-stroke\s+\/heat-stroke\/\s+301/);
  assert.match(redirects, /\/tccc\s+\/tccc\/\s+301/);
  assert.doesNotMatch(redirects, /\/fms\/\*/);
});

test("buildHeaders adds security headers and long-lived hashed asset caching", () => {
  const headers = buildHeaders({
    fmsBase: "/fms/",
    heatStrokeBase: "/heat-stroke/",
    tcccBase: "/tccc/",
  });

  assert.match(headers, /\/\*/);
  assert.match(headers, /X-Frame-Options: DENY/);
  assert.match(headers, /X-Content-Type-Options: nosniff/);
  assert.match(headers, /Referrer-Policy: strict-origin-when-cross-origin/);
  assert.match(headers, /Content-Security-Policy: default-src 'self'/);
  assert.match(
    headers,
    /script-src 'self' 'unsafe-inline' https:\/\/cdnjs\.cloudflare\.com https:\/\/cdn\.jsdelivr\.net https:\/\/static\.cloudflareinsights\.com/,
  );
  assert.match(headers, /connect-src 'self' https:\/\/cloudflareinsights\.com/);
  assert.doesNotMatch(headers, /connect-src[^;]*api\.openweathermap\.org/);
  assert.doesNotMatch(headers, /cdn\.tailwindcss\.com/);
  assert.match(headers, /\/_next\/static\/\*/);
  assert.match(headers, /\/fms\/assets\/\*/);
  assert.match(headers, /\/heat-stroke\/assets\/\*/);
  assert.match(headers, /\/tccc\/assets\/\*/);
  assert.match(headers, /\/tccc\/images\/\*/);
  assert.match(headers, /\/tccc\/videos\/\*/);
  assert.match(headers, /Cache-Control: public, max-age=31536000, immutable/);
  assert.match(headers, /\/fms\/sw\.js\n  Cache-Control: no-cache/);
  assert.match(headers, /\/heat-stroke\/sw\.js\n  Cache-Control: no-cache/);
  assert.match(headers, /\/tccc\/sw\.js\n  Cache-Control: no-cache/);
});

test("Cloudflare build contract reports free-tier file count and file-size guardrails", async () => {
  const tempDir = await mkdtemp(path.join(tmpdir(), "hongyishi-cf-budget-"));

  try {
    await writeFile(path.join(tempDir, "small.txt"), "abc");

    const stats = await collectCloudflareFreeTierStats(tempDir);

    assert.equal(stats.fileCount, 1);
    assert.equal(stats.totalBytes, 3);
    assert.equal(stats.largestFile.relativePath, "small.txt");
    assert.equal(CLOUDFLARE_FREE_TIER_LIMITS.maxFileBytes, 25 * 1024 * 1024);

    await assert.rejects(
      () =>
        validateCloudflareFreeTierBudget(tempDir, {
          ...CLOUDFLARE_FREE_TIER_LIMITS,
          maxFileBytes: 2,
        }),
      /exceeds Cloudflare Pages single-file limit/,
    );

    await assert.rejects(
      () =>
        validateCloudflareFreeTierBudget(tempDir, {
          ...CLOUDFLARE_FREE_TIER_LIMITS,
          maxFiles: 0,
        }),
      /contains 1 files/,
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("rewriteHeatStrokeText scopes root-relative static links and service worker registration", () => {
  const input = `
    <html><head><title>热射病</title></head><body>
    <a href="/pages/热指数查询.html">热指数</a>
    <img src="/assets/images/icon.png">
    <script>navigator.serviceWorker.register('/sw.js')</script>
    </body></html>
  `;

  const output = rewriteHeatStrokeText(input, "index.html", "/heat-stroke/");

  assert.match(output, /href="\/heat-stroke\/pages\/heat-index"/);
  assert.match(output, /src="\/heat-stroke\/assets\/images\/icon\.png"/);
  assert.match(
    output,
    /navigator\.serviceWorker\.register\('\/heat-stroke\/sw\.js', \{ scope: '\/heat-stroke\/' \}\)/,
  );
  assert.match(output, /data-hongyishi-mobile-nav/);
  assert.match(output, /data-hongyishi-content-governance/);
  assert.match(output, /data-hongyishi-guide-runtime/);
  assert.match(output, /data-hongyishi-guide-trigger/);
  assert.match(output, /hys:heatStroke:guide:v1:index\.html:seen/);
  assert.match(output, /内容状态：待复核/);
  assert.match(output, /热射病防治使用引导|热指数查询使用引导/);
  assert.match(output, /不替代急救指挥、临床诊疗和当地规范/);
  assert.match(output, /data-hys-mobile-nav-scope="heatStroke"/);
  assert.match(
    output,
    /href="\/heat-stroke\/" aria-current="page" title="打开热射病资料"><span>资料<\/span>/,
  );
  assert.match(
    output,
    /href="\/heat-stroke\/pages\/field-treatment" title="打开热射病处置"/,
  );
  assert.doesNotMatch(output, /主站|\/\?tab=tools/);
  assert.doesNotMatch(output, /data-hongyishi-tccc-shell/);
});

test("rewriteHeatStrokeText scopes manifest and service worker cache entries", () => {
  const manifest = JSON.stringify({
    name: "红医师热射病防治",
    start_url: "/index.html",
    icons: [{ src: "/assets/images/icon.png" }],
  });
  const rewrittenManifest = JSON.parse(
    rewriteHeatStrokeText(manifest, "manifest.json", "/heat-stroke/"),
  );

  assert.equal(rewrittenManifest.start_url, "/heat-stroke/");
  assert.equal(rewrittenManifest.scope, "/heat-stroke/");
  assert.equal(rewrittenManifest.icons[0].src, "assets/images/icon.png");

  const worker =
    "const urlsToCache = ['/', '/index.html', '/manifest.json', '/assets/css/styles.css', '/pages/a.html'];";
  const rewrittenWorker = rewriteHeatStrokeText(
    worker,
    "sw.js",
    "/heat-stroke/",
  );

  assert.match(rewrittenWorker, /'\/heat-stroke\/'/);
  assert.match(rewrittenWorker, /'\/heat-stroke\/index\.html'/);
  assert.match(rewrittenWorker, /'\/heat-stroke\/assets\/css\/styles\.css'/);
  assert.match(rewrittenWorker, /'\/heat-stroke\/pages\/a\.html'/);
});

test("rewriteHeatStrokeText replaces Chinese page filenames with Cloudflare-safe aliases", () => {
  assert.equal(
    mapHeatStrokeOutputPath("pages/热指数查询.html"),
    "pages/heat-index.html",
  );
  assert.equal(
    mapHeatStrokeOutputPath("pages/热射病现场处置.html"),
    "pages/field-treatment.html",
  );
  assert.equal(
    mapHeatStrokeOutputPath("assets/images/icon.png"),
    "assets/images/icon.png",
  );

  const input = `
    <a href="/pages/热指数查询.html">热指数</a>
    <a href="热耐力评估.html">热耐力</a>
    <script>const cache = ['/pages/热射病现场处置.html'];</script>
  `;
  const output = rewriteHeatStrokeText(
    input,
    "pages/热指数查询.html",
    "/heat-stroke/",
  );

  assert.match(output, /href="\/heat-stroke\/pages\/heat-index"/);
  assert.match(output, /href="heat-tolerance"/);
  assert.match(output, /'\/heat-stroke\/pages\/field-treatment\.html'/);
  assert.doesNotMatch(
    output,
    /热指数查询\.html|热耐力评估\.html|热射病现场处置\.html/,
  );
});

test("shouldCopyHeatStrokePath keeps deployable static assets and excludes app internals", () => {
  assert.equal(shouldCopyHeatStrokePath("index.html"), true);
  assert.equal(shouldCopyHeatStrokePath("assets/js/script.js"), true);
  assert.equal(shouldCopyHeatStrokePath("assets/css/tailwind.css"), true);
  assert.equal(shouldCopyHeatStrokePath("pages/热指数查询.html"), true);
  assert.equal(
    shouldCopyHeatStrokePath("assets/vendors/tailwind.compiler.js"),
    false,
  );
  assert.equal(
    shouldCopyHeatStrokePath("assets/vendors/framer-motion.js"),
    false,
  );
  assert.equal(shouldCopyHeatStrokePath("assets/.DS_Store"), false);
  assert.equal(shouldCopyHeatStrokePath("api/openweather.js"), false);
  assert.equal(shouldCopyHeatStrokePath("package.json"), false);
});

test("FMS demo media references are base-path aware for subdirectory deployment", async () => {
  const sourceFiles = [
    path.join(fmsSrcDir, "components", "assessment", "TestCard.tsx"),
    path.join(fmsSrcDir, "components", "ui", "demo-floating-button.tsx"),
    path.join(fmsSrcDir, "pages", "TrainingPage.tsx"),
  ];

  for (const file of sourceFiles) {
    const source = await readFile(file, "utf8");

    assert.doesNotMatch(
      source,
      /[`"']\/demo\//,
      `${path.relative(repoRoot, file)} should not hard-code /demo/`,
    );
  }
});

test("FMS visual system uses the Hongyishi namespace instead of Brooklyn naming", async () => {
  const sourceFiles = await collectFiles(fmsSrcDir, [".css", ".ts", ".tsx"]);

  assert.ok(sourceFiles.length > 0, "expected FMS source files");

  for (const file of sourceFiles) {
    const source = await readFile(file, "utf8");

    assert.doesNotMatch(
      source,
      /brooklyn-|Brooklyn|布鲁克林/i,
      `${path.relative(repoRoot, file)} should not use Brooklyn visual naming`,
    );
  }

  const styles = await readFile(path.join(fmsSrcDir, "index.css"), "utf8");
  assert.match(styles, /\.hys-card/);
  assert.match(styles, /\.hys-nav/);
});

test("rewriteTcccText scopes root-relative app links, manifest, and service worker registration", () => {
  const input = `
    <html><body>
    <link rel="manifest" href="/manifest.json">
    <link rel="stylesheet" href="/assets/css/tailwind.css">
    <script src="/pwa-register.js"></script>
    <img src="/icons/icon-192.png">
    <a href="/pages/TCCC标准流程.html">流程</a>
    <script>navigator.serviceWorker.register('/sw.js')</script>
    </body></html>
  `;

  const output = rewriteTcccText(input, "index.html", "/tccc/");

  assert.match(output, /href="\/tccc\/manifest\.json"/);
  assert.match(output, /href="\/tccc\/assets\/css\/tailwind\.css"/);
  assert.match(output, /src="\/tccc\/pwa-register\.js"/);
  assert.match(output, /src="\/tccc\/icons\/icon-192\.png"/);
  assert.match(output, /href="\/tccc\/pages\/tccc-standard"/);
  assert.match(
    output,
    /navigator\.serviceWorker\.register\('\/tccc\/sw\.js', \{ scope: '\/tccc\/' \}\)/,
  );
  assert.match(output, /data-hongyishi-mobile-nav/);
  assert.match(output, /data-hys-mobile-nav-scope="tccc"/);
  assert.match(
    output,
    /href="\/tccc\/" aria-current="page" title="打开 TCCC 目录"><span>目录<\/span>/,
  );
  assert.match(
    output,
    /href="\/tccc\/pages\/tfc-hemorrhage" title="打开 TCCC TFC"/,
  );
  assert.doesNotMatch(output, /主站|\/\?tab=tools/);
  assert.doesNotMatch(output, /data-hongyishi-tccc-shell/);

  const flowOutput = rewriteTcccText(
    "<html><head><title>TCCC标准流程</title></head><body><main>流程</main></body></html>",
    "pages/TCCC标准流程.html",
    "/tccc/",
  );
  assert.match(flowOutput, /data-hongyishi-tccc-shell/);
  assert.match(flowOutput, /data-hongyishi-content-governance/);
  assert.match(flowOutput, /data-hongyishi-guide-runtime/);
  assert.match(flowOutput, /data-hongyishi-guide-trigger/);
  assert.match(flowOutput, /hys:tccc:guide:v1:pages\/tccc-standard\.html:seen/);
  assert.match(flowOutput, /不能替代现行作战医疗规范/);
  assert.match(flowOutput, /TCCC 标准流程使用引导/);
  assert.match(flowOutput, /data-hongyishi-mobile-nav/);
  assert.match(
    flowOutput,
    /href="\/tccc\/pages\/tccc-standard" aria-current="page" title="打开 TCCC 标准"><span>标准<\/span>/,
  );
  assert.doesNotMatch(flowOutput, /主站|\/\?tab=tools/);

  const manifest = JSON.stringify({
    name: "TCCC",
    start_url: "/index.html",
    icons: [{ src: "/icons/icon-192.png" }],
  });
  const rewrittenManifest = JSON.parse(
    rewriteTcccText(manifest, "manifest.json", "/tccc/"),
  );

  assert.equal(rewrittenManifest.start_url, "/tccc/");
  assert.equal(rewrittenManifest.scope, "/tccc/");
  assert.equal(rewrittenManifest.icons[0].src, "icons/icon-192.png");
});

test("injectMobileBottomNav is mobile-only and idempotent", () => {
  const input = "<html><body><main>content</main></body></html>";
  const once = injectMobileBottomNav(input, "records");
  const twice = injectMobileBottomNav(once, "records");

  assert.match(once, /@media \(max-width: 768px\)/);
  assert.match(once, /class="hys-mobile-nav t-panel-reveal"/);
  assert.match(once, /hys-mobile-nav-enter/);
  assert.match(once, /prefers-reduced-motion: reduce/);
  assert.match(once, /href="\/\?tab=records" aria-current="page"/);
  assert.match(once, /title="打开红医师记录"/);
  assert.match(once, /<span>记录<\/span>/);
  assert.doesNotMatch(once, /<small>|主站/);
  assert.equal(twice, once);
});

test("injectMobileBottomNav can render project-local tabs", () => {
  const input = "<html><body><main>content</main></body></html>";
  const output = injectMobileBottomNav(input, "field-treatment", {
    scope: "heatStroke",
    basePath: "/heat-stroke/",
  });

  assert.match(output, /aria-label="热射病项目移动端导航"/);
  assert.match(output, /data-hys-mobile-nav-scope="heatStroke"/);
  assert.match(output, /class="hys-mobile-nav t-panel-reveal"/);
  assert.match(
    output,
    /href="\/heat-stroke\/pages\/field-treatment" aria-current="page" title="打开热射病处置"/,
  );
  assert.match(output, /href="\/heat-stroke\/pages\/heat-index"/);
  assert.match(output, /href="\/heat-stroke\/"/);
  assert.doesNotMatch(output, /主站|\/\?tab=/);
});

test("injectContentGovernanceBanner adds source and review state once", () => {
  const input =
    "<html><head><title>x</title></head><body><main>content</main></body></html>";
  const output = injectContentGovernanceBanner(input, {
    label: "测试项目",
    sourceName: "测试来源",
    version: "测试版本",
    reviewedAt: "2026-06-23",
    statusLabel: "待复核",
    disclaimer: "仅供训练参考。",
    officialUpdateUrl: "https://example.com/source",
  });

  assert.match(output, /data-hongyishi-content-governance/);
  assert.match(output, /内容状态：待复核/);
  assert.match(
    output,
    /来源：测试来源 · 版本：测试版本 · 复核日期：2026-06-23\./,
  );
  assert.match(output, /href="https:\/\/example\.com\/source"/);
  assert.equal(
    injectContentGovernanceBanner(output, {
      label: "测试项目",
      sourceName: "测试来源",
      version: "测试版本",
      reviewedAt: "2026-06-23",
      statusLabel: "待复核",
      disclaimer: "仅供训练参考。",
    }),
    output,
  );
});

test("injectUsageGuide adds first-use guide runtime once", () => {
  const input =
    "<html><head><title>x</title></head><body><main>content</main></body></html>";
  const config = {
    title: "测试使用引导",
    summary: "先看风险，再操作。",
    steps: ["第一步", "第二步"],
    boundary: "仅供测试。",
  };
  const output = injectUsageGuide(input, config, {
    project: "heatStroke",
    relativePath: "pages/field-treatment.html",
  });

  assert.match(output, /data-hongyishi-guide-entry/);
  assert.match(output, /data-hongyishi-guide-runtime/);
  assert.match(output, /data-hongyishi-guide-trigger/);
  assert.match(
    output,
    /hys:heatStroke:guide:v1:pages\/field-treatment\.html:seen/,
  );
  assert.match(output, /测试使用引导/);
  assert.match(output, /scrollIntoView/);
  assert.match(output, /requestAnimationFrame/);
  assert.match(output, /仅供测试。/);
  assert.equal(
    injectUsageGuide(output, config, {
      project: "heatStroke",
      relativePath: "pages/field-treatment.html",
    }),
    output,
  );
});

test("resolveUsageGuideConfig follows safe page aliases", () => {
  assert.equal(
    resolveUsageGuideConfig("heatStroke", "pages/热射病现场处置.html").title,
    "现场处置使用引导",
  );
  assert.equal(
    resolveUsageGuideConfig("tccc", "pages/TFC大出血算法.html").title,
    "TFC 大出血算法使用引导",
  );
  assert.equal(
    resolveUsageGuideConfig("tccc", "index.html").title,
    "TCCC 使用引导",
  );
});

test("injectTcccBrandShell adds unified brand context only to TCCC flow pages", () => {
  const input = `
    <html><head><title>战术战斗伤员救护 | TCCC官方流程</title></head>
    <body><script>const html = '<h1>\${step.title}</h1>';</script><div id="tcccMasterContainer"></div></body></html>
  `;
  const output = injectTcccBrandShell(input, "pages/TCCC标准流程.html");
  const rootOutput = injectTcccBrandShell(input, "index.html");

  assert.match(output, /data-hongyishi-tccc-shell/);
  assert.match(output, /红医师 \/ 战场救护/);
  assert.match(output, /href="\/tccc\/">项目首页/);
  assert.match(output, /当前流程：战术战斗伤员救护/);
  assert.match(output, /内容状态：待复核/);
  assert.match(output, /id="hys-tccc-main"/);
  assert.equal(rootOutput, input);
  assert.equal(injectTcccBrandShell(output, "pages/TCCC标准流程.html"), output);
});

test("rewriteTcccText replaces Chinese page filenames with Cloudflare-safe aliases", () => {
  assert.equal(
    mapTcccOutputPath("pages/TCCC标准流程.html"),
    "pages/tccc-standard.html",
  );
  assert.equal(
    mapTcccOutputPath("pages/循环系统教案.html"),
    "pages/circulation-course.html",
  );
  assert.equal(
    mapTcccOutputPath("images/01_heart_valves_diagram.webp"),
    "images/01_heart_valves_diagram.webp",
  );

  const input = `
    <a href="pages/TFC气道算法.html">气道</a>
    <script>const cache = ['/pages/TCCC战伤流程数据.js'];</script>
  `;
  const output = rewriteTcccText(input, "index.html", "/tccc/");

  assert.match(output, /href="pages\/tfc-airway"/);
  assert.match(output, /'\/tccc\/pages\/tccc-flow-data\.js'/);
  assert.doesNotMatch(output, /TFC气道算法\.html|TCCC战伤流程数据\.js/);
});

test("shouldCopyTcccPath keeps deployable static assets and excludes app internals", () => {
  assert.equal(shouldCopyTcccPath("index.html"), true);
  assert.equal(shouldCopyTcccPath("pwa-register.js"), true);
  assert.equal(shouldCopyTcccPath("assets/css/tailwind.css"), true);
  assert.equal(shouldCopyTcccPath("icons/icon-512.png"), true);
  assert.equal(shouldCopyTcccPath("images/01_heart_valves_diagram.webp"), true);
  assert.equal(shouldCopyTcccPath("videos/01_iv_access_technique.webm"), true);
  assert.equal(shouldCopyTcccPath("pages/TCCC标准流程.html"), true);
  assert.equal(shouldCopyTcccPath(".DS_Store"), false);
  assert.equal(shouldCopyTcccPath(".cursor/rules/html-style.mdc"), false);
  assert.equal(shouldCopyTcccPath("package.json"), false);
});

test("heat-stroke source pages expose unified brand navigation", async () => {
  const pageFiles = (await readdir(heatStrokePagesDir)).filter((file) =>
    file.endsWith(".html"),
  );

  assert.ok(pageFiles.length > 0, "expected heat-stroke source pages");

  for (const file of pageFiles) {
    const html = await readFile(path.join(heatStrokePagesDir, file), "utf8");

    assert.match(
      html,
      /class=["'][^"']*\bbrand-nav\b/,
      `${file} should include brand nav`,
    );
    assert.match(
      html,
      /href=["']\/["'][^>]*>总入口</,
      `${file} should link back to the portal`,
    );
    assert.match(
      html,
      /href=["']\.\.\/index\.html["'][^>]*>项目首页</,
      `${file} should link back to heat-stroke home`,
    );
    assert.match(
      html,
      /class=["'][^"']*\bskip-link\b/,
      `${file} should include a skip link`,
    );
  }
});

test("heat-stroke source pages use the Hongyishi visual shell", async () => {
  const htmlFiles = [
    path.join(repoRoot, "apps", "heat-stroke", "index.html"),
    ...(await readdir(heatStrokePagesDir))
      .filter((file) => file.endsWith(".html"))
      .map((file) => path.join(heatStrokePagesDir, file)),
  ];
  const styles = await readFile(
    path.join(repoRoot, "apps", "heat-stroke", "assets", "css", "styles.css"),
    "utf8",
  );

  assert.match(
    styles,
    /body\.hys-heat-page/,
    "shared styles should define the heat-stroke visual shell",
  );
  assert.match(
    styles,
    /\.hys-heat-card/,
    "shared styles should expose reusable heat-stroke card styling",
  );
  assert.match(
    styles,
    /\.hys-heat-button/,
    "shared styles should expose reusable heat-stroke button styling",
  );

  for (const file of htmlFiles) {
    const html = await readFile(file, "utf8");
    const relative = path.relative(repoRoot, file);
    const bodyTag = html.match(/<body[^>]*>/)?.[0] ?? "";

    assert.match(
      bodyTag,
      /\bhys-heat-page\b/,
      `${relative} should opt into the Hongyishi visual shell`,
    );
    assert.doesNotMatch(
      bodyTag,
      /\bbg-black\b/,
      `${relative} body should not keep the old black app shell`,
    );
  }
});

test("heat-stroke interactive tool DOM contracts remain intact", async () => {
  const contracts = [
    {
      file: "热指数查询.html",
      selectors: [
        'id="location-input"',
        'id="search-btn"',
        'id="manual-temp"',
        'id="manual-humidity"',
        'id="calculate-hi-btn"',
        'id="heat-index-chart"',
        "../assets/js/script.js",
      ],
    },
    {
      file: "热射病现场处置.html",
      selectors: [
        'id="start-btn"',
        'id="next-btn-1"',
        'id="next-btn-2"',
        'id="next-btn-3"',
        'id="next-btn-4"',
        'id="next-btn-5"',
        'id="finish-btn"',
        'id="restart-btn"',
        'id="temperature-input"',
        'class="progress-container hys-flow-status mb-8"',
        'class="custom-checkbox"',
      ],
    },
    {
      file: "热耐力评估.html",
      selectors: [
        'id="height"',
        'id="weight"',
        'id="rating-form"',
        'data-question-id="q1"',
        'data-question-id="q18"',
        'id="score-section"',
        'id="score-display"',
      ],
    },
    {
      file: "热射病通关挑战.html",
      selectors: [
        'id="intro"',
        'id="prevention"',
        'id="prevention-quiz"',
        'id="warning"',
        'id="treatment"',
        'id="treatment-quiz"',
        'id="quiz"',
      ],
    },
  ];

  for (const contract of contracts) {
    const html = await readFile(
      path.join(heatStrokePagesDir, contract.file),
      "utf8",
    );

    for (const selector of contract.selectors) {
      assert.match(
        html,
        new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
        `${contract.file} should retain ${selector}`,
      );
    }
  }
});

test("heat-stroke source uses locally built Tailwind CSS without runtime animation vendor", async () => {
  const htmlFiles = [
    path.join(repoRoot, "apps", "heat-stroke", "index.html"),
    ...(await readdir(heatStrokePagesDir))
      .filter((file) => file.endsWith(".html"))
      .map((file) => path.join(heatStrokePagesDir, file)),
  ];

  for (const file of htmlFiles) {
    const html = await readFile(file, "utf8");
    const relative = path.relative(repoRoot, file);

    assert.match(
      html,
      /assets\/css\/tailwind\.css/,
      `${relative} should load built Tailwind CSS`,
    );
    assert.doesNotMatch(
      html,
      /tailwind\.compiler\.js|framer-motion\.js/,
      `${relative} should not load runtime vendors`,
    );
  }
});

test("heat-stroke JavaScript sources do not expose fallback OpenWeather keys", async () => {
  const scriptFiles = (await readdir(heatStrokeScriptsDir)).filter((file) =>
    file.endsWith(".js"),
  );

  assert.ok(scriptFiles.length > 0, "expected heat-stroke JavaScript sources");

  for (const file of scriptFiles) {
    const source = await readFile(
      path.join(heatStrokeScriptsDir, file),
      "utf8",
    );

    assert.doesNotMatch(
      source,
      /const\s+FALLBACK_API_KEY\s*=\s*['"][^'"]{8,}['"]/,
      `${file} should not contain a non-empty fallback API key`,
    );
    assert.doesNotMatch(
      source,
      /https:\/\/api\.openweathermap\.org/,
      `${file} should not contain a direct OpenWeather API endpoint`,
    );
  }
});

test("heat-stroke source page filenames all map to ASCII deployment paths", async () => {
  const pageFiles = (await readdir(heatStrokePagesDir)).filter((file) =>
    file.endsWith(".html"),
  );

  assert.ok(pageFiles.length > 0, "expected heat-stroke source pages");

  for (const file of pageFiles) {
    const outputPath = mapHeatStrokeOutputPath(`pages/${file}`);
    assert.doesNotMatch(
      outputPath,
      /[^\x00-\x7F]/,
      `${file} should have an ASCII deployment alias`,
    );
  }
});

test("TCCC source homepage and service worker only reference existing deployable pages", async () => {
  const pageFiles = new Set(
    (await readdir(tcccPagesDir)).filter(
      (file) => file.endsWith(".html") || file.endsWith(".js"),
    ),
  );
  const sources = [
    ["index.html", await readFile(path.join(tcccDir, "index.html"), "utf8")],
    ["sw.js", await readFile(path.join(tcccDir, "sw.js"), "utf8")],
  ];

  assert.ok(pageFiles.size > 0, "expected TCCC source pages");

  for (const [sourceName, source] of sources) {
    const references = [
      ...source.matchAll(/pages\/([^"'`]+?\.(?:html|js))/g),
    ].map((match) => decodeURI(match[1]));

    for (const reference of references) {
      assert.ok(
        pageFiles.has(reference),
        `${sourceName} references missing TCCC page ${reference}`,
      );
    }
  }
});

test("TCCC source uses locally built Tailwind CSS instead of the CDN runtime", async () => {
  const rootFiles = ["index.html", "offline.html", "sw.js"];
  const pageFiles = (await readdir(tcccPagesDir)).filter((file) =>
    file.endsWith(".html"),
  );

  for (const file of [
    ...rootFiles,
    ...pageFiles.map((file) => `pages/${file}`),
  ]) {
    const source = await readFile(path.join(tcccDir, file), "utf8");

    assert.doesNotMatch(
      source,
      /cdn\.tailwindcss\.com/,
      `${file} should not load Tailwind from the CDN`,
    );

    if (file.endsWith(".html")) {
      assert.match(
        source,
        /<link rel="stylesheet" href="\/assets\/css\/tailwind\.css">/,
        `${file} should load the local Tailwind build`,
      );
    }
  }
});

test("TCCC source uses local icon CSS instead of Font Awesome CDN", async () => {
  const rootFiles = ["index.html", "offline.html", "sw.js"];
  const pageFiles = (await readdir(tcccPagesDir)).filter((file) =>
    file.endsWith(".html"),
  );

  for (const file of [
    ...rootFiles,
    ...pageFiles.map((file) => `pages/${file}`),
  ]) {
    const source = await readFile(path.join(tcccDir, file), "utf8");

    assert.doesNotMatch(
      source,
      /font-awesome|fa-solid-900|fa-regular-400/,
      `${file} should not load Font Awesome CDN assets`,
    );

    if (file.endsWith(".html") && file !== "offline.html") {
      assert.match(
        source,
        /<link rel="stylesheet" href="\/assets\/css\/fontawesome-shim\.css">/,
        `${file} should load the local icon shim`,
      );
    }
  }
});

test("TCCC source page filenames all map to ASCII deployment paths", async () => {
  const pageFiles = (await readdir(tcccPagesDir)).filter(
    (file) => file.endsWith(".html") || file.endsWith(".js"),
  );

  assert.ok(pageFiles.length > 0, "expected TCCC source pages");

  for (const file of pageFiles) {
    const outputPath = mapTcccOutputPath(`pages/${file}`);
    assert.doesNotMatch(
      outputPath,
      /[^\x00-\x7F]/,
      `${file} should have an ASCII deployment alias`,
    );
  }
});
