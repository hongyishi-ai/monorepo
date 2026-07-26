import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env.HONGYISHI_AUDIT_BASE_URL ?? "http://127.0.0.1:3028";
const routes = [
  "/fms/assessment",
  "/heat-stroke/pages/8-4-6-rule",
  "/heat-stroke/pages/core-temperature-cooling",
  "/heat-stroke/pages/treatment-system-consensus",
  "/heat-stroke/pages/heat-index",
];
const widths = [320, 360, 375, 390, 414];

function summarizeOffenders(offenders) {
  return offenders
    .map(
      (item) =>
        `${item.tag}${item.id ? `#${item.id}` : ""} right=${item.right} width=${item.width} text="${item.text}" class="${item.className}"`,
    )
    .join("\n");
}

const browser = await chromium.launch({ headless: true });

try {
  for (const width of widths) {
    const page = await browser.newPage({
      deviceScaleFactor: 2,
      isMobile: true,
      viewport: { width, height: 900 },
    });

    for (const route of routes) {
      await page.goto(new URL(route, baseUrl).toString(), {
        timeout: 30000,
        waitUntil: "domcontentloaded",
      });
      await page.waitForTimeout(800);

      const result = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll("body *"));
        const isContainedByMobileSafeScroller = (element) => {
          let current = element.parentElement;

          while (current && current !== document.body) {
            const style = window.getComputedStyle(current);
            const rect = current.getBoundingClientRect();

            if (
              ["auto", "scroll", "hidden", "clip"].includes(style.overflowX) &&
              rect.left >= -0.5 &&
              rect.right <= window.innerWidth + 0.5
            ) {
              return true;
            }

            current = current.parentElement;
          }

          return false;
        };
        const offenders = elements
          .filter((element) => !isContainedByMobileSafeScroller(element))
          .map((element) => {
            const rect = element.getBoundingClientRect();

            return {
              className:
                typeof element.className === "string" ? element.className : "",
              id: element.id,
              right: Math.round(rect.right * 10) / 10,
              tag: element.tagName.toLowerCase(),
              text: (element.textContent ?? "")
                .trim()
                .replace(/\s+/g, " ")
                .slice(0, 72),
              width: Math.round(rect.width * 10) / 10,
            };
          })
          .filter((item) => item.right > window.innerWidth + 0.5)
          .sort((a, b) => b.right - a.right)
          .slice(0, 8);

        return {
          documentScrollWidth: document.documentElement.scrollWidth,
          offenders,
          viewportWidth: window.innerWidth,
        };
      });

      assert.equal(
        result.offenders.length,
        0,
        `${route} has mobile overflow at ${width}px:\n${summarizeOffenders(
          result.offenders,
        )}`,
      );

      assert.ok(
        result.documentScrollWidth <= result.viewportWidth,
        `${route} document width ${result.documentScrollWidth}px exceeds ${result.viewportWidth}px at ${width}px`,
      );

      console.log(`ok ${width}px ${route}`);
    }

    await page.close();
  }
} finally {
  await browser.close();
}
