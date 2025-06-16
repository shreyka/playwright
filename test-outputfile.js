const { chromium } = require('./packages/playwright-core');

(async () => {
  console.log('🧪 Testing page.pause() with outputFile parameter...');
  
  // Launch browser
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🌐 Navigating to test page...');
  await page.goto('https://www.ycombinator.com');
  
  // Wait a moment for the page to load
  await page.waitForTimeout(2000);
  
  console.log('⏸️  Pausing page with outputFile...');
  
  // Test the new outputFile functionality
  const pausePromise = page.pause({
    outputFile: '/Users/shreyak/Documents/Simplex/playwright/output/test-output.py'
  });
  
  // Set up resume to be called after 5 seconds
  setTimeout(async () => {
    console.log('▶️  Resuming page...');
    try {
      await page.resume();
      console.log('✅ Resume called successfully!');
    } catch (error) {
      console.error('❌ Error on resume:', error.message);
    }
  }, 10000);
  
  // Wait for the pause to complete (when resume is called)
  await pausePromise;
  
  console.log('✅ Pause/resume cycle completed successfully!');
  console.log('📁 Generated code should be saved to: ./test-output.py');
  
  // Close browser
  await browser.close();
  
  console.log('🎉 Test completed!');
})().catch(console.error); 