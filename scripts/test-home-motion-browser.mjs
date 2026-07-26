import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const baseUrl = process.env.HONGYISHI_AUDIT_BASE_URL ?? "http://127.0.0.1:3040";
const appShellSource = await readFile(
  path.join(
    repoRoot,
    "apps",
    "portal",
    "src",
    "app",
    "_components",
    "mobile",
    "MobileAppShell.tsx",
  ),
  "utf8",
);

assert.doesNotMatch(
  appShellSource,
  /loadingDelay|RouteLoadingOverlay|setTimeout|preventDefault/,
  "homepage navigation should not introduce an artificial delay",
);

const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const width of [320, 390, 1280]) {
    const context = await browser.newContext({
      viewport: { width, height: width === 1280 ? 900 : 844 },
    });
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: "networkidle" });

    const dimensions = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    assert.equal(
      dimensions.scroll,
      dimensions.client,
      `homepage should not overflow horizontally at ${width}px`,
    );

    const themeButton = page.locator("[data-hongyishi-global-theme-toggle]");
    assert.doesNotMatch(
      (await themeButton.getAttribute("aria-label")) ?? "",
      /undefined/,
    );

    if (width < 768) {
      const statusBox = await page.locator("[data-home-status]").boundingBox();
      const themeBox = await themeButton.boundingBox();
      assert.ok(statusBox && themeBox);
      assert.equal(themeBox.width, 44);
      assert.equal(themeBox.height, 44);
      assert.ok(statusBox.x + statusBox.width <= themeBox.x);

      await page.locator('[data-home-tab="tools"]').click();
      const panel = page.locator('[data-home-panel="tools"]');
      await panel.waitFor();
      const motion = await panel.evaluate((element) => ({
        duration: getComputedStyle(element).animationDuration,
        name: getComputedStyle(element).animationName,
      }));
      assert.equal(motion.duration, "0.22s");
      assert.notEqual(motion.name, "none");
      assert.equal(
        await page
          .locator('[data-home-tab="tools"]')
          .getAttribute("aria-current"),
        "page",
      );
      results.push({ dimensions, motion, width });
    } else {
      const visibleMainLinks = await page.evaluate(
        () =>
          [...document.querySelectorAll("main a")].filter(
            (link) => link.getClientRects().length > 0,
          ).length,
      );
      assert.equal(visibleMainLinks, 3);
      results.push({ dimensions, width });
    }

    await context.close();
  }

  {
    const context = await browser.newContext({
      reducedMotion: "reduce",
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.locator('[data-home-tab="tools"]').click();
    const panel = page.locator('[data-home-panel="tools"]');
    await panel.waitFor();
    assert.equal(
      await panel.evaluate(
        (element) => getComputedStyle(element).animationName,
      ),
      "none",
    );
    results.push({ check: "reduced-motion" });
    await context.close();
  }
} finally {
  await browser.close();
}

console.log(
  JSON.stringify(
    {
      baseUrl,
      checks: results,
    },
    null,
    2,
  ),
);
