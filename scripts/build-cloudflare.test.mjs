import assert from "node:assert/strict";
import {
  access,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { test } from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildCloudflareBasePathsFromRegistry,
  cloudflareBasePaths,
  buildContentGovernanceFromRegistry,
  buildHeaders,
  buildRedirects,
  CLOUDFLARE_FREE_TIER_LIMITS,
  collectCloudflareFreeTierStats,
  contentGovernance,
  copyHeatStrokeApp,
  injectMobileBottomNav,
  injectMobileHamburgerNav,
  injectContentGovernanceBanner,
  injectTcccBrandShell,
  mapHeatStrokeOutputPath,
  mapTcccOutputPath,
  materializeNextOwnedProjectEntry,
  nextOwnedHeatStrokePageAliases,
  normalizeBasePath,
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
const projectRegistryPath = path.join(
  repoRoot,
  "apps",
  "portal",
  "src",
  "lib",
  "projects.json",
);

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
  const redirects = buildRedirects();

  assert.match(redirects, /\/fms\s+\/fms\/\s+301/);
  assert.match(redirects, /\/heat-stroke\s+\/heat-stroke\/\s+301/);
  assert.match(redirects, /\/tccc\s+\/tccc\/\s+301/);
  assert.doesNotMatch(redirects, /\/fms\/\*/);
});

test("buildHeaders adds security headers and long-lived hashed asset caching", () => {
  const headers = buildHeaders();

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

test("Cloudflare app base paths are derived from the portal project registry", async () => {
  const registry = JSON.parse(await readFile(projectRegistryPath, "utf8"));
  const source = await readFile(
    path.join(repoRoot, "scripts", "build-cloudflare.mjs"),
    "utf8",
  );
  const expectedBasePaths = {
    fmsBase: "/fms/",
    heatStrokeBase: "/heat-stroke/",
    tcccBase: "/tccc/",
  };

  assert.deepEqual(
    buildCloudflareBasePathsFromRegistry(registry),
    expectedBasePaths,
  );
  assert.deepEqual(cloudflareBasePaths, expectedBasePaths);
  assert.doesNotMatch(source, /fmsBase\s*=\s*"\/fms\/"/);
  assert.doesNotMatch(source, /heatStrokeBase\s*=\s*"\/heat-stroke\/"/);
  assert.doesNotMatch(source, /tcccBase\s*=\s*"\/tccc\/"/);
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

test("Cloudflare content governance is derived from the portal project registry", async () => {
  const registry = JSON.parse(await readFile(projectRegistryPath, "utf8"));
  const source = await readFile(
    path.join(repoRoot, "scripts", "build-cloudflare.mjs"),
    "utf8",
  );
  const projectById = new Map(
    registry.platformProjects.map((project) => [project.id, project]),
  );

  assert.deepEqual(
    contentGovernance.heatStroke,
    buildContentGovernanceFromRegistry(projectById.get("heat-stroke")),
  );
  assert.deepEqual(
    contentGovernance.tccc,
    buildContentGovernanceFromRegistry(projectById.get("tccc")),
  );
  assert.match(source, /projects\.json/);
  assert.doesNotMatch(source, /sourceName:\s*"热射病防治指南与现场处置资料"/);
  assert.doesNotMatch(
    source,
    /sourceName:\s*"CoTCCC 2017 战术战伤救护流程资料"/,
  );
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
  assert.doesNotMatch(output, /data-hongyishi-guide-runtime/);
  assert.doesNotMatch(output, /data-hongyishi-guide-trigger/);
  assert.doesNotMatch(output, /data-hongyishi-guide-entry/);
  assert.doesNotMatch(output, /hys:heatStroke:guide/);
  assert.match(output, /内容状态：待复核/);
  assert.match(output, /不替代急救指挥、临床诊疗和当地规范/);
  assert.match(output, /data-hys-mobile-nav-scope="heatStroke"/);
  assert.match(output, /class="hys-mobile-nav t-panel-reveal"/);
  assert.match(output, /hys-mobile-nav__item/);
  assert.match(output, /data-hongyishi-app-shell/);
  assert.match(output, /<style data-hongyishi-app-shell>/);
  assert.match(output, /--background: 38 47% 91%;/);
  assert.match(output, /\.dark\s*\{/);
  assert.match(output, /--background: 0 0% 3%;/);
  assert.match(output, /\.hys-nav\s*\{/);
  assert.match(output, /\.hys-nav-link\s*\{/);
  assert.match(output, /::view-transition-new\(root\)/);
  assert.match(output, /class="hys-mobile-top-menu t-panel-reveal"/);
  assert.match(output, /data-hys-mobile-menu-toggle/);
  assert.match(output, /data-hys-theme-toggle/);
  assert.match(output, /切换深浅色主题/);
  assert.match(output, /class="hys-mobile-theme-toggle hys-nav-link"/);
  assert.match(output, /class="hys-mobile-top-menu__button hys-nav-link"/);
  assert.match(output, /class="t-icon-swap h-5 w-5 place-items-center"/);
  assert.match(output, /<svg[^>]+data-icon="moon"/);
  assert.match(output, /<svg[^>]+data-icon="sun"/);
  assert.match(output, /<svg[^>]+data-icon="menu"/);
  assert.match(output, /<svg[^>]+data-icon="close"/);
  assert.match(output, /data-icon="moon"/);
  assert.match(output, /data-icon="menu"/);
  assert.match(output, /data-icon="close"/);
  assert.doesNotMatch(output, /fa-regular|fa-solid/);
  assert.doesNotMatch(output, /content: "☰"|content: "☀"|content: "☾"/);
  assert.match(output, /localStorage\.getItem\('theme'\)/);
  assert.match(output, /localStorage\.setItem\('theme', theme\)/);
  assert.match(output, /root\.classList\.toggle\('dark', theme === 'dark'\)/);
  assert.match(output, /font-size: 1rem;/);
  assert.match(output, /padding: 0\.7rem 0\.9rem;/);
  assert.match(output, /flex-direction: row !important;/);
  assert.match(
    output,
    /class="hys-mobile-top-menu__panel t-stagger lg:hidden border-t border-border bg-background"/,
  );
  assert.match(output, /data-hys-mobile-menu-panel hidden/);
  assert.doesNotMatch(output, /\.hys-mobile-top-menu \{\s+position: fixed;/);
  assert.doesNotMatch(output, /html\[data-hys-theme="dark"\]/);
  assert.doesNotMatch(output, /hys:heatStroke:theme/);
  assert.match(output, /\.dark body\.hys-heat-page/);
  assert.match(output, /\.dark body\.hys-heat-page \.project-shell/);
  assert.match(output, /\.dark body\.hys-heat-page \.poster-hero/);
  assert.match(output, /\.dark body\.hys-heat-page \.grid-item/);
  assert.match(output, /\.brand-nav-links \{\s+display: none !important;/);
  assert.match(output, /<header[^>]+class="[^"]*\bhys-nav\b[^"]*"/);
  assert.match(
    output,
    /href="\/heat-stroke\/" aria-current="page" title="打开热射病资料"><span>资料<\/span>/,
  );
  assert.match(
    output,
    /href="\/" title="打开热射病总入口"><span>总入口<\/span>/,
  );
  assert.match(output, /项目首页/);
  assert.match(
    output,
    /href="\/heat-stroke\/pages\/field-treatment" title="打开热射病处置"/,
  );
  assert.match(
    output,
    /href="\/heat-stroke\/pages\/diagnosis-treatment-guideline"/,
  );
  assert.match(output, /诊断与治疗指南/);
  assert.match(
    output,
    /href="\/heat-stroke\/pages\/treatment-system-consensus"/,
  );
  assert.match(output, /href="\/heat-stroke\/pages\/heat-tolerance"/);
  assert.match(output, /href="\/heat-stroke\/pages\/core-temperature-cooling"/);
  assert.match(output, /href="\/heat-stroke\/pages\/challenge"/);
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

test("shouldCopyHeatStrokePath can preserve a Next-owned project entry", () => {
  const nextOwnedOptions = { routeOwner: "next" };

  assert.equal(shouldCopyHeatStrokePath("index.html", nextOwnedOptions), false);
  assert.equal(
    shouldCopyHeatStrokePath("manifest.json", nextOwnedOptions),
    true,
  );
  assert.equal(shouldCopyHeatStrokePath("sw.js", nextOwnedOptions), true);
  assert.equal(
    shouldCopyHeatStrokePath("pages/热指数查询.html", nextOwnedOptions),
    true,
  );
  assert.equal(
    shouldCopyHeatStrokePath("pages/关于本项目.html", {
      ...nextOwnedOptions,
      nextOwnedPageAliases: new Set([
        "pages/about.html",
        "pages/8-4-6-rule.html",
        "pages/diagnosis-treatment-guideline.html",
        "pages/treatment-system-consensus.html",
        "pages/core-temperature-cooling.html",
      ]),
    }),
    false,
  );
  assert.equal(
    shouldCopyHeatStrokePath("pages/8-4-6黄金法则.html", {
      ...nextOwnedOptions,
      nextOwnedPageAliases: new Set([
        "pages/about.html",
        "pages/8-4-6-rule.html",
        "pages/diagnosis-treatment-guideline.html",
        "pages/treatment-system-consensus.html",
        "pages/core-temperature-cooling.html",
      ]),
    }),
    false,
  );
  assert.equal(
    shouldCopyHeatStrokePath("pages/中国热射病诊断与治疗指南.html", {
      ...nextOwnedOptions,
      nextOwnedPageAliases: new Set([
        "pages/about.html",
        "pages/8-4-6-rule.html",
        "pages/diagnosis-treatment-guideline.html",
        "pages/treatment-system-consensus.html",
        "pages/core-temperature-cooling.html",
      ]),
    }),
    false,
  );
  assert.equal(
    shouldCopyHeatStrokePath("pages/热射病救治体系建设标准专家共识.html", {
      ...nextOwnedOptions,
      nextOwnedPageAliases: new Set([
        "pages/about.html",
        "pages/8-4-6-rule.html",
        "pages/diagnosis-treatment-guideline.html",
        "pages/treatment-system-consensus.html",
        "pages/core-temperature-cooling.html",
      ]),
    }),
    false,
  );
  assert.equal(
    shouldCopyHeatStrokePath("pages/热射病核心体温监测与降温方法.html", {
      ...nextOwnedOptions,
      nextOwnedPageAliases: new Set([
        "pages/about.html",
        "pages/8-4-6-rule.html",
        "pages/diagnosis-treatment-guideline.html",
        "pages/treatment-system-consensus.html",
        "pages/core-temperature-cooling.html",
      ]),
    }),
    false,
  );
  assert.equal(
    shouldCopyHeatStrokePath("assets/js/script.js", nextOwnedOptions),
    true,
  );
});

test("default heat-stroke Next-owned pages include migrated deep pages", () => {
  assert.equal(nextOwnedHeatStrokePageAliases.has("pages/about.html"), true);
  assert.equal(
    nextOwnedHeatStrokePageAliases.has("pages/8-4-6-rule.html"),
    true,
  );
  assert.equal(
    nextOwnedHeatStrokePageAliases.has(
      "pages/diagnosis-treatment-guideline.html",
    ),
    true,
  );
  assert.equal(
    nextOwnedHeatStrokePageAliases.has("pages/treatment-system-consensus.html"),
    true,
  );
  assert.equal(
    nextOwnedHeatStrokePageAliases.has("pages/core-temperature-cooling.html"),
    true,
  );
});

test("copyHeatStrokeApp preserves a Next-owned entry while copying static heat-stroke assets", async () => {
  const tempDir = await mkdtemp(path.join(tmpdir(), "hongyishi-heat-copy-"));
  const srcDir = path.join(tempDir, "src");
  const destDir = path.join(tempDir, "dest");

  try {
    await mkdir(path.join(srcDir, "pages"), { recursive: true });
    await mkdir(path.join(srcDir, "assets", "js"), { recursive: true });
    await writeFile(
      path.join(srcDir, "index.html"),
      "<html><body>legacy heat stroke home</body></html>",
    );
    await writeFile(
      path.join(srcDir, "manifest.json"),
      JSON.stringify({
        name: "红医师热射病防治",
        start_url: "/index.html",
        icons: [{ src: "/assets/images/icon.png" }],
      }),
    );
    await writeFile(
      path.join(srcDir, "sw.js"),
      "const urlsToCache = ['/', '/index.html', '/manifest.json'];",
    );
    await writeFile(
      path.join(srcDir, "pages", "热指数查询.html"),
      '<html><body><a href="/index.html">首页</a></body></html>',
    );
    await writeFile(
      path.join(srcDir, "pages", "关于本项目.html"),
      "<html><body>legacy about page</body></html>",
    );
    await writeFile(
      path.join(srcDir, "pages", "8-4-6黄金法则.html"),
      "<html><body>legacy rule page</body></html>",
    );
    await writeFile(
      path.join(srcDir, "pages", "中国热射病诊断与治疗指南.html"),
      "<html><body>legacy diagnosis guideline page</body></html>",
    );
    await writeFile(
      path.join(srcDir, "pages", "热射病救治体系建设标准专家共识.html"),
      "<html><body>legacy treatment system consensus page</body></html>",
    );
    await writeFile(
      path.join(srcDir, "pages", "热射病核心体温监测与降温方法.html"),
      "<html><body>legacy core temperature cooling page</body></html>",
    );
    await writeFile(
      path.join(srcDir, "assets", "js", "script.js"),
      "window.__heatStrokeTool = true;",
    );

    await copyHeatStrokeApp(srcDir, destDir, "/heat-stroke/", {
      routeOwner: "next",
      nextOwnedPageAliases: new Set([
        "pages/about.html",
        "pages/8-4-6-rule.html",
        "pages/diagnosis-treatment-guideline.html",
        "pages/treatment-system-consensus.html",
        "pages/core-temperature-cooling.html",
      ]),
    });

    await assert.rejects(() => access(path.join(destDir, "index.html")), {
      code: "ENOENT",
    });
    assert.match(
      await readFile(path.join(destDir, "manifest.json"), "utf8"),
      /"start_url": "\/heat-stroke\/"/,
    );
    assert.match(
      await readFile(path.join(destDir, "sw.js"), "utf8"),
      /'\/heat-stroke\/manifest\.json'/,
    );
    assert.match(
      await readFile(path.join(destDir, "pages", "heat-index.html"), "utf8"),
      /首页/,
    );
    await assert.rejects(
      () => access(path.join(destDir, "pages", "about.html")),
      { code: "ENOENT" },
    );
    await assert.rejects(
      () => access(path.join(destDir, "pages", "8-4-6-rule.html")),
      { code: "ENOENT" },
    );
    await assert.rejects(
      () =>
        access(
          path.join(destDir, "pages", "diagnosis-treatment-guideline.html"),
        ),
      { code: "ENOENT" },
    );
    await assert.rejects(
      () =>
        access(path.join(destDir, "pages", "treatment-system-consensus.html")),
      { code: "ENOENT" },
    );
    await assert.rejects(
      () =>
        access(path.join(destDir, "pages", "core-temperature-cooling.html")),
      { code: "ENOENT" },
    );
    assert.equal(
      await readFile(path.join(destDir, "assets", "js", "script.js"), "utf8"),
      "window.__heatStrokeTool = true;",
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("materializeNextOwnedProjectEntry maps Next static export pages to project slash routes", async () => {
  const tempDir = await mkdtemp(path.join(tmpdir(), "hongyishi-next-entry-"));

  try {
    await writeFile(
      path.join(tempDir, "heat-stroke.html"),
      "<html><body>Next heat stroke entry</body></html>",
    );

    const cloudflareOwned = await materializeNextOwnedProjectEntry(
      tempDir,
      "/heat-stroke/",
      "cloudflare-build",
    );
    assert.equal(cloudflareOwned, false);
    await assert.rejects(
      () => access(path.join(tempDir, "heat-stroke", "index.html")),
      { code: "ENOENT" },
    );

    const nextOwned = await materializeNextOwnedProjectEntry(
      tempDir,
      "/heat-stroke/",
      "next",
    );
    assert.equal(nextOwned, true);
    assert.equal(
      await readFile(path.join(tempDir, "heat-stroke", "index.html"), "utf8"),
      "<html><body>Next heat stroke entry</body></html>",
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
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
  assert.match(output, /data-hongyishi-mobile-menu/);
  assert.match(output, /data-hys-mobile-menu-scope="tccc"/);
  assert.match(output, /data-hongyishi-app-shell/);
  assert.match(output, /<style data-hongyishi-app-shell>/);
  assert.match(output, /--background: 38 47% 91%;/);
  assert.match(output, /\.dark\s*\{/);
  assert.match(output, /\.hys-nav\s*\{/);
  assert.match(output, /::view-transition-new\(root\)/);
  assert.match(output, /class="hys-mobile-theme-toggle hys-nav-link"/);
  assert.match(output, /class="hys-mobile-top-menu__button hys-nav-link"/);
  assert.match(output, /class="t-icon-swap h-5 w-5 place-items-center"/);
  assert.match(output, /切换深浅色主题/);
  assert.match(output, /<svg[^>]+data-icon="moon"/);
  assert.match(output, /<svg[^>]+data-icon="sun"/);
  assert.match(output, /<svg[^>]+data-icon="menu"/);
  assert.match(output, /<svg[^>]+data-icon="close"/);
  assert.match(output, /data-icon="moon"/);
  assert.match(output, /data-icon="menu"/);
  assert.match(output, /data-icon="close"/);
  assert.match(output, /href="\/" title="打开 TCCC 总入口"/);
  assert.match(
    output,
    /href="\/tccc\/" aria-current="page" title="打开 TCCC 项目首页"/,
  );
  assert.match(output, /href="\/tccc\/pages\/tccc-standard"/);
  assert.match(output, /localStorage\.getItem\('theme'\)/);
  assert.match(output, /localStorage\.setItem\('theme', theme\)/);
  assert.match(output, /root\.classList\.toggle\('dark', theme === 'dark'\)/);
  assert.doesNotMatch(output, /html\[data-hys-theme="dark"\]/);
  assert.doesNotMatch(output, /hys:tccc:theme/);
  assert.match(output, /body[^>]+class="[^"]*\bhys-tccc-page\b[^"]*"/);
  assert.match(output, /\.dark body\.hys-tccc-page/);
  assert.match(
    output,
    /href="\/tccc\/" aria-current="page" title="打开 TCCC 目录"><span>目录<\/span>/,
  );
  assert.match(
    output,
    /href="\/tccc\/pages\/tfc-hemorrhage" title="打开 TCCC TFC"/,
  );
  assert.doesNotMatch(output, /主站|\/\?tab=tools/);
  assert.match(output, /data-hongyishi-tccc-shell/);
  assert.doesNotMatch(output, /class="hys-tccc-shell\b/);
  assert.doesNotMatch(output, /content: "☰"|content: "☀"|content: "☾"/);

  const flowOutput = rewriteTcccText(
    "<html><head><title>TCCC标准流程</title></head><body><main>流程</main></body></html>",
    "pages/TCCC标准流程.html",
    "/tccc/",
  );
  assert.match(flowOutput, /data-hongyishi-tccc-shell/);
  assert.match(flowOutput, /data-hongyishi-content-governance/);
  assert.doesNotMatch(flowOutput, /data-hongyishi-guide-runtime/);
  assert.doesNotMatch(flowOutput, /data-hongyishi-guide-trigger/);
  assert.doesNotMatch(flowOutput, /data-hongyishi-guide-entry/);
  assert.doesNotMatch(flowOutput, /hys:tccc:guide/);
  assert.match(flowOutput, /不能替代现行作战医疗规范/);
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

test("injectMobileHamburgerNav renders FMS-style heat-stroke header controls", () => {
  const input =
    '<html><head></head><body><header class="brand-nav"><nav class="brand-nav-inner"><a class="brand-mark" href="/heat-stroke/">红医师 / 热射病防治</a><div class="brand-nav-links"><a href="/">总入口</a></div></nav></header><main>content</main></body></html>';
  const output = injectMobileHamburgerNav(input, "field-treatment", {
    scope: "heatStroke",
    basePath: "/heat-stroke/",
  });
  const twice = injectMobileHamburgerNav(output, "field-treatment", {
    scope: "heatStroke",
    basePath: "/heat-stroke/",
  });

  assert.match(output, /aria-label="热射病项目移动端导航"/);
  assert.match(output, /data-hys-mobile-menu-scope="heatStroke"/);
  assert.match(output, /data-hongyishi-app-shell/);
  assert.match(output, /<style data-hongyishi-app-shell>/);
  assert.match(output, /--background: 38 47% 91%;/);
  assert.match(output, /\.dark\s*\{/);
  assert.match(output, /--background: 0 0% 3%;/);
  assert.match(output, /\.hys-nav\s*\{/);
  assert.match(output, /\.hys-nav-link\s*\{/);
  assert.match(output, /::view-transition-new\(root\)/);
  assert.match(output, /class="hys-mobile-top-menu t-panel-reveal"/);
  assert.match(output, /data-hys-mobile-menu-toggle/);
  assert.match(output, /data-hys-theme-toggle/);
  assert.match(output, /切换深浅色主题/);
  assert.match(output, /class="hys-mobile-theme-toggle hys-nav-link"/);
  assert.match(output, /class="hys-mobile-top-menu__button hys-nav-link"/);
  assert.match(output, /class="t-icon-swap h-5 w-5 place-items-center"/);
  assert.match(output, /<svg[^>]+data-icon="moon"/);
  assert.match(output, /<svg[^>]+data-icon="sun"/);
  assert.match(output, /<svg[^>]+data-icon="menu"/);
  assert.match(output, /<svg[^>]+data-icon="close"/);
  assert.match(output, /data-icon="moon"/);
  assert.match(output, /data-icon="sun"/);
  assert.match(output, /data-icon="menu"/);
  assert.match(output, /data-icon="close"/);
  assert.doesNotMatch(output, /fa-regular|fa-solid/);
  assert.match(output, /aria-expanded="false"/);
  assert.match(
    output,
    /class="hys-mobile-top-menu__panel t-stagger lg:hidden border-t border-border bg-background"/,
  );
  assert.match(output, /data-hys-mobile-menu-panel hidden/);
  assert.match(output, /brand-nav-inner[\s\S]*hys-mobile-top-menu/);
  assert.match(output, /localStorage\.getItem\('theme'\)/);
  assert.match(output, /localStorage\.setItem\('theme', theme\)/);
  assert.match(output, /root\.classList\.toggle\('dark', theme === 'dark'\)/);
  assert.doesNotMatch(output, /hys:heatStroke:theme/);
  assert.doesNotMatch(output, /html\[data-hys-theme="dark"\]/);
  assert.match(output, /\.dark body\.hys-heat-page/);
  assert.match(output, /\.dark body\.hys-heat-page \.project-shell/);
  assert.match(output, /\.dark body\.hys-heat-page \.poster-hero/);
  assert.match(output, /\.dark body\.hys-heat-page \.grid-item/);
  assert.doesNotMatch(output, /\.hys-mobile-top-menu \{\s+position: fixed;/);
  assert.match(output, /\.brand-nav-links \{\s+display: none !important;/);
  assert.match(output, /<header[^>]+class="[^"]*\bhys-nav\b[^"]*"/);
  assert.match(
    output,
    /href="\/" title="打开热射病总入口"><span>总入口<\/span>/,
  );
  assert.match(
    output,
    /href="\/heat-stroke\/" title="打开热射病项目首页"><span>项目首页<\/span>/,
  );
  assert.match(
    output,
    /href="\/heat-stroke\/pages\/field-treatment" aria-current="page" title="打开热射病现场处置"/,
  );
  assert.match(output, /href="\/heat-stroke\/pages\/heat-index"/);
  assert.match(
    output,
    /href="\/heat-stroke\/pages\/diagnosis-treatment-guideline"/,
  );
  assert.match(output, /诊断与治疗指南/);
  assert.match(
    output,
    /href="\/heat-stroke\/pages\/treatment-system-consensus"/,
  );
  assert.match(output, /救治体系共识/);
  assert.match(output, /href="\/heat-stroke\/pages\/heat-tolerance"/);
  assert.match(output, /href="\/heat-stroke\/pages\/core-temperature-cooling"/);
  assert.match(output, /href="\/heat-stroke\/pages\/challenge"/);
  assert.match(output, /href="\/heat-stroke\/"/);
  assert.doesNotMatch(output, /class="hys-mobile-nav__item/);
  assert.doesNotMatch(output, /主站|\/\?tab=/);
  assert.equal(twice, output);
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

test("injectTcccBrandShell adds unified brand context to TCCC pages", () => {
  const input = `
    <html><head><title>战术战斗伤员救护 | TCCC官方流程</title></head>
    <body><script>const html = '<h1>\${step.title}</h1>';</script><div id="tcccMasterContainer"></div></body></html>
  `;
  const output = injectTcccBrandShell(input, "pages/TCCC标准流程.html");
  const rootOutput = injectTcccBrandShell(input, "index.html");

  assert.match(output, /data-hongyishi-tccc-shell/);
  assert.match(output, /data-hongyishi-app-shell/);
  assert.match(output, /class="hys-nav hys-static-project-nav brand-nav"/);
  assert.match(output, /class="hys-logo hys-static-logo brand-mark"/);
  assert.match(output, /body[^>]+class="[^"]*\bhys-tccc-page\b[^"]*"/);
  assert.match(output, /红医师 \/ 战场救护/);
  assert.match(output, /href="\/tccc\/">项目首页/);
  assert.match(output, /当前流程：战术战斗伤员救护/);
  assert.match(output, /内容状态：待复核/);
  assert.match(output, /id="hys-tccc-main"/);
  assert.doesNotMatch(output, /class="hys-tccc-shell\b/);
  assert.doesNotMatch(output, /hys-tccc-shell__/);
  assert.match(rootOutput, /data-hongyishi-tccc-shell/);
  assert.match(rootOutput, /data-hongyishi-app-shell/);
  assert.match(rootOutput, /红医师 \/ 战场救护/);
  assert.match(rootOutput, /当前流程：战术战斗伤员救护/);
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

test("shouldCopyTcccPath can preserve a Next-owned project entry", () => {
  const nextOwnedOptions = { routeOwner: "next" };

  assert.equal(shouldCopyTcccPath("index.html", nextOwnedOptions), false);
  assert.equal(shouldCopyTcccPath("manifest.json", nextOwnedOptions), true);
  assert.equal(shouldCopyTcccPath("sw.js", nextOwnedOptions), true);
  assert.equal(shouldCopyTcccPath("pwa-register.js", nextOwnedOptions), true);
  assert.equal(
    shouldCopyTcccPath("pages/TCCC标准流程.html", nextOwnedOptions),
    true,
  );
  assert.equal(
    shouldCopyTcccPath("images/01_heart_valves_diagram.webp", nextOwnedOptions),
    true,
  );
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
      /href=["']\/heat-stroke\/["'][^>]*>项目首页</,
      `${file} should link back to the canonical heat-stroke home`,
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
