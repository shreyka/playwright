// Simple test to verify resume() doesn't hang
const { chromium } = require('./packages/playwright-core');

(async () => {
  console.log('🧪 Testing simple pause/resume...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('https://example.com');
  console.log('✅ Page loaded');
  
  // Test pause/resume cycle
  console.log('⏸️  Calling page.pause()...');
  const pausePromise = page.pause();
  
  // Resume after 3 seconds
  setTimeout(async () => {
    console.log('▶️  Calling page.resume()...');
    try {
      await page.resume();
      console.log('✅ Resume completed successfully!');
    } catch (error) {
      console.error('❌ Resume failed:', error.message);
    }
  }, 3000);
  
  // Wait for pause to complete
  await pausePromise;
  console.log('🎉 Pause/resume cycle completed!');
  
  await browser.close();
  console.log('✨ Test finished!');
})().catch(console.error); 