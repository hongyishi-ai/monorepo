const { chromium } = require('playwright');

const apps = [
  { name: 'pharmacy', url: 'http://localhost:5174', expected: '药房' },
  { name: 'clinic', url: 'http://localhost:8080', expected: '诊所' },
  { name: 'fms', url: 'http://localhost:5173', expected: 'FMS' },
  { name: 'heat-stroke', url: 'http://localhost:3000', expected: '热射病' },
  { name: 'portal', url: 'http://localhost:3001', expected: '红医师' },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  let allOk = true;

  for (const app of apps) {
    const page = await browser.newPage();
    try {
      const response = await page.goto(app.url, { timeout: 15000, waitUntil: 'domcontentloaded' });
      const status = response?.status() ?? 0;
      const title = await page.title();
      const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 200) ?? '');

      if (status >= 200 && status < 400) {
        console.log(`✅ ${app.name}: HTTP ${status} | title: "${title}"`);
        console.log(`   内容片段: ${bodyText.replace(/\n/g, ' ').slice(0, 100)}`);
      } else {
        console.log(`❌ ${app.name}: HTTP ${status}`);
        allOk = false;
      }
    } catch (e) {
      console.log(`❌ ${app.name}: ${e.message}`);
      allOk = false;
    }
    await page.close();
  }

  await browser.close();
  process.exit(allOk ? 0 : 1);
})();
