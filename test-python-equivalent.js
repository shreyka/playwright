// Use local Playwright build with outputFile modifications
const { chromium } = require('./packages/playwright-core');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('🧪 Testing page.pause() with outputFile parameter (JS equivalent to Python test)...');
  console.log('📍 Using Playwright from:', require.resolve('./packages/playwright-core'));
  
  // Create output directory if it doesn't exist
  const outputDir = '/Users/shreyak/Documents/Simplex/playwright/output';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
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
  const outputFile = '/Users/shreyak/Documents/Simplex/playwright/output/test_js_python_equivalent.py';
  console.log(`📝 Output file will be: ${outputFile}`);
  
  // Create a promise for the pause
  const pausePromise = page.pause({ outputFile });
  
  // Set up resume to be called after 10 seconds
  setTimeout(async () => {
    console.log('▶️  Resuming page...');
    try {
      await page.resume();
      console.log('✅ Resume called successfully!');
    } catch (error) {
      console.error(`❌ Error on resume: ${error.message}`);
    }
  }, 10000);
  
  // Wait for the pause to complete (when resume is called)
  await pausePromise;
  
  console.log('✅ Pause/resume cycle completed successfully!');
  console.log('📁 Generated code should be saved to: ./test-output.py');
  
  // Check if file was created
  if (fs.existsSync(outputFile)) {
    console.log('✅ Output file was created!');
    const content = fs.readFileSync(outputFile, 'utf8');
    console.log(`📄 File content length: ${content.length} characters`);
    console.log(`📄 File content preview: ${content.substring(0, 200)}...`);
  } else {
    console.log('❌ Output file was NOT created');
  }
  
  // Close browser
  await browser.close();
  
  console.log('🎉 Test completed!');
})().catch(console.error); 