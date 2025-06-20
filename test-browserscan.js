const { chromium } = require('./packages/playwright-core');

(async () => {
  console.log('🔍 Opening browserscan.net for manual inspection...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--start-maximized']
  });
  
  const context = await browser.newContext({
    viewport: null
  });
  
  const page = await context.newPage();
  
  console.log('📍 Navigating to browserscan.net...');
  await page.goto('https://www.browserscan.net/', { waitUntil: 'networkidle' });
  
  console.log('\n✅ Page loaded! Check the results manually.');
  console.log('⏳ Browser will stay open. Press Ctrl+C to exit.');
  
  // Keep browser open
  await new Promise(() => {});
})(); 