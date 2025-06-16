const { chromium } = require('playwright');

(async () => {
  console.log('🧪 Testing pause with outputFile and resume functionality...');
  
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
  
  // Check if init script worked
  const testFlag = await page.evaluate(() => window.__testFlag);
  console.log('✅ Init script test flag:', testFlag);
  
  console.log('⏸️  Pausing page with outputFile...');
  
  // CORRECT PATTERN: Start the pause and get the promise
  const pausePromise = page.pause({
    outputFile: '/Users/shreyak/Documents/Simplex/playwright/output/final_testing.py'
  });
  
  // Set up resume to be called after 10 seconds
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
  console.log('📁 Generated code should be saved to: /Users/shreyak/Documents/Simplex/playwright/capture_output.js');
  
  // Navigate to another page to test that everything still works
  console.log('🔄 Testing navigation after resume...');
  await page.goto('https://httpbin.org/html');
  await page.waitForTimeout(1000);
  
  console.log('🔍 Verifying init script still works on new page...');
  const testFlag2 = await page.evaluate(() => window.__testFlag);
  console.log('✅ Init script test flag on new page:', testFlag2);
  
  // Close browser
  await browser.close();
  
  console.log('🎉 All tests passed!');
})().catch(console.error); 