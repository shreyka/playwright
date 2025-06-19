const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false
  });
  const context = await browser.newContext();
  await page.goto('https://www.browserscan.net/');

  // ---------------------
  await context.close();
  await browser.close();
})();