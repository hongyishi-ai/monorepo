import assert from "node:assert/strict";

import { chromium } from "playwright";

const baseUrl = process.env.HONGYISHI_AUDIT_BASE_URL ?? "http://127.0.0.1:3030";
const route = new URL("/tccc/pages/tfc-airway", baseUrl).toString();
const screenshotDirectory = process.env.HONGYISHI_SCREENSHOT_DIR;

async function waitForNode(page, nodeId) {
  const currentNode = page.locator("[data-tccc-current-node]");
  const deadline = Date.now() + 5_000;

  while (Date.now() < deadline) {
    if ((await currentNode.getAttribute("data-tccc-current-node")) === nodeId) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }

  assert.fail(`Timed out waiting for TCCC flow node: ${nodeId}`);
}

async function advance(page, nodeId) {
  await page.locator("[data-tccc-next]").click();
  await waitForNode(page, nodeId);
}

async function choose(page, choiceId, nodeId) {
  await page.locator(`[data-tccc-choice="${choiceId}"]`).click();
  await waitForNode(page, nodeId);
}

async function openPage(browser, options = {}) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    ...options,
  });
  const page = await context.newPage();
  await page.goto(route, { waitUntil: "networkidle" });
  return { context, page };
}

const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const width of [320, 375, 390, 1280]) {
    const { context, page } = await openPage(browser, {
      viewport: { width, height: width === 1280 ? 900 : 844 },
    });
    const dimensions = await page.evaluate(() => ({
      body: document.body.scrollWidth,
      client: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
    }));

    assert.equal(
      dimensions.document,
      dimensions.client,
      `Document overflows horizontally at ${width}px`,
    );
    assert.ok(
      dimensions.body <= dimensions.client,
      `Body overflows horizontally at ${width}px`,
    );
    results.push({ check: "viewport", dimensions, width });

    if (width === 320) {
      const mobileNav = page.locator("[data-hongyishi-mobile-nav]");
      assert.equal(
        (
          await mobileNav.locator('[aria-current="page"]').textContent()
        )?.trim(),
        "TFC",
      );

      const menuButton = page.locator("[data-hys-mobile-menu-toggle]");
      const menuPanelId = await menuButton.getAttribute("aria-controls");
      assert.ok(menuPanelId);
      await menuButton.click();
      const activeMenuItem = page.locator(
        `#${menuPanelId} [aria-current="page"]`,
      );
      assert.match((await activeMenuItem.textContent()) ?? "", /气道/);
      await menuButton.click();

      const lightColors = await page.evaluate(() => ({
        body: getComputedStyle(document.body).backgroundColor,
        card: getComputedStyle(
          document.querySelector("[data-tccc-current-node]"),
        ).backgroundColor,
      }));
      await page.locator("[data-hys-theme-toggle]").click();
      await page.locator("html.dark").waitFor();
      const darkColors = await page.evaluate(() => ({
        body: getComputedStyle(document.body).backgroundColor,
        card: getComputedStyle(
          document.querySelector("[data-tccc-current-node]"),
        ).backgroundColor,
      }));
      assert.notDeepEqual(darkColors, lightColors);
      results.push({ check: "project chrome", darkColors, lightColors });
    }

    if (screenshotDirectory && (width === 390 || width === 1280)) {
      await page.screenshot({
        fullPage: true,
        path: `${screenshotDirectory}/tccc-airway-${width}.png`,
      });
    }
    await context.close();
  }

  {
    const { context, page } = await openPage(browser);
    await advance(page, "airway-assessment");
    assert.equal(
      await page.evaluate(() => document.activeElement?.tagName),
      "H1",
    );
    await choose(page, "conscious-clear", "conscious-clear");
    await advance(page, "reassessment");
    await advance(page, "complete");
    assert.equal(
      await page.locator("[data-tccc-next-module]").getAttribute("href"),
      "/tccc/pages/tccc-breathing",
    );
    await page.locator("[data-tccc-back]").click();
    await waitForNode(page, "reassessment");
    await page.locator("[data-tccc-restart]").click();
    await waitForNode(page, "intro");
    results.push({ check: "conscious path, back and restart" });

    await advance(page, "airway-assessment");
    await choose(page, "unconscious-clear", "unconscious-clear");
    await advance(page, "initial-measures-effective");
    await choose(page, "effective", "reassessment");
    await advance(page, "complete");
    results.push({ check: "unconscious effective path" });

    await page.getByRole("button", { name: "再练一次" }).click();
    await waitForNode(page, "intro");
    await advance(page, "airway-assessment");
    await choose(page, "traumatic-obstruction", "traumatic-obstruction");
    await advance(page, "initial-measures-effective");
    await choose(page, "not-effective", "cricothyroidotomy");
    const surgicalText = await page
      .locator("[data-tccc-current-node]")
      .innerText();
    assert.match(surgicalText, /EtCO₂/);
    assert.match(surgicalText, /利多卡因/);
    await advance(page, "reassessment");
    await advance(page, "complete");
    results.push({ check: "traumatic obstruction surgical path" });
    await context.close();
  }

  {
    const { context, page } = await openPage(browser, {
      reducedMotion: "reduce",
    });
    await page.locator("[data-tccc-next]").click();
    await waitForNode(page, "airway-assessment");
    const transition = await page
      .locator("[data-tccc-current-node]")
      .evaluate((element) => ({
        duration: getComputedStyle(element).transitionDuration,
        mediaMatches: matchMedia("(prefers-reduced-motion: reduce)").matches,
        property: getComputedStyle(element).transitionProperty,
      }));
    assert.equal(transition.mediaMatches, true);
    assert.equal(transition.property, "none");
    results.push({ check: "reduced motion", transition });
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
      passed: results.length,
    },
    null,
    2,
  ),
);
