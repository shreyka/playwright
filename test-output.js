const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false
  });
  const context = await browser.newContext();
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Enter your Password' }).click();
  await page.getByRole('textbox', { name: 'Enter your OneID' }).click();

  // ---------------------
  await context.close();
  await browser.close();
})();