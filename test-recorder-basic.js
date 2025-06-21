
// Quick recorder test
const { chromium } = require('./packages/playwright-core');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Check if basic automation flags are hidden
  const flags = await page.evaluate(() => ({
    webdriver: navigator.webdriver,
    automation: window.chrome?.cdc_adoQpoasnfa76pfcZLmcfl_Array
  }));
  
  console.log('Security check:', flags);
  
  await page.goto('https://example.com');
  await page.click('h1'); // Test if click works
  
  console.log('✅ Basic test passed. Now try: npx playwright codegen https://example.com');
  
  await browser.close();
})();
