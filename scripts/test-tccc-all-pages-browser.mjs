import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const registrySource = await readFile(
  path.join(
    repoRoot,
    "apps",
    "portal",
    "src",
    "app",
    "tccc",
    "_data",
    "tcccFlowRegistry.ts",
  ),
  "utf8",
);
const moduleSlugs = [
  ...registrySource.matchAll(/^\s+slug: "([a-z0-9-]+)",$/gm),
].map((match) => match[1]);
const baseUrl = process.env.HONGYISHI_AUDIT_BASE_URL ?? "http://127.0.0.1:3030";

async function waitForNode(page, nodeId) {
  await page.waitForFunction(
    (expected) =>
      document
        .querySelector("[data-tccc-current-node]")
        ?.getAttribute("data-tccc-current-node") === expected,
    nodeId,
  );
}

assert.equal(moduleSlugs.length, 34);
assert.equal(new Set(moduleSlugs).size, moduleSlugs.length);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  reducedMotion: "reduce",
  viewport: { width: 320, height: 844 },
});
const page = await context.newPage();
const results = [];

try {
  for (const slug of moduleSlugs) {
    const route = new URL(`/tccc/pages/${slug}`, baseUrl).toString();
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });

    assert.equal(response?.status(), 200, `${slug} should return HTTP 200`);
    await page.locator(`[data-tccc-module="${slug}"]`).waitFor();
    const governanceText = await page
      .locator("[data-hongyishi-content-governance]")
      .innerText();
    assert.match(governanceText, /2026-05-01/);
    assert.match(governanceText, /待医学专家终审/);
    assert.doesNotMatch(await page.locator("body").innerText(), /2017/);

    const dimensions = await page.evaluate(() => ({
      body: document.body.scrollWidth,
      client: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
    }));
    assert.equal(
      dimensions.document,
      dimensions.client,
      `${slug} should not overflow the 320px viewport`,
    );
    assert.ok(dimensions.body <= dimensions.client);

    const header = page.locator("[data-hongyishi-project-theme-owner]");
    assert.equal((await header.boundingBox())?.y, 0);
    assert.equal(
      await page
        .locator("[data-tccc-current-node]")
        .getAttribute("data-tccc-current-node"),
      "intro",
    );

    await page.locator("[data-tccc-next]").click();
    const assessmentNode =
      slug === "tfc-airway" ? "airway-assessment" : "assessment";
    await waitForNode(page, assessmentNode);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const headerBox = await header.boundingBox();
    assert.equal(headerBox?.y, 0);
    const controlsBox = await page
      .locator("[data-tccc-mobile-controls]")
      .boundingBox();
    assert.ok(headerBox && controlsBox);
    assert.ok(
      controlsBox.y >= headerBox.y + headerBox.height - 4,
      `${slug} controls should never sit behind the fixed header`,
    );
    assert.ok(
      controlsBox.y + controlsBox.height <= 844,
      `${slug} controls should remain inside the mobile viewport`,
    );

    await page.locator("[data-tccc-back]").click();
    await waitForNode(page, "intro");
    await page.locator("[data-tccc-next]").click();
    await waitForNode(page, assessmentNode);

    if (slug !== "tfc-airway") {
      await page.locator("[data-tccc-choice]").first().click();
      await page.locator('[data-tccc-current-node$="-action"]').waitFor();
      await page.locator("[data-tccc-next]").click();
      await waitForNode(page, "reassess");
      await page.locator('[data-tccc-choice="not-controlled"]').click();
      await waitForNode(page, "assessment");
    }

    await page.locator("[data-tccc-restart]").click();
    await waitForNode(page, "intro");
    results.push({ dimensions, slug });
  }
} finally {
  await context.close();
  await browser.close();
}

console.log(
  JSON.stringify(
    {
      baseUrl,
      modules: results.length,
      viewport: "320x844",
    },
    null,
    2,
  ),
);
