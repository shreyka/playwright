const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false
  });
  const context = await browser.newContext();
  await page.goto('https://www.browserscan.net/');
  await page.locator('span').filter({ hasText: 'Verizon Business' }).click();
  await page.goto('https://www.producthunt.com/');
  await page.close();

  // ---------------------
  await context.close();
  await browser.close();
})();