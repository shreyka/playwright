// Use local Playwright build
const { chromium } = require('./packages/playwright-core');

(async () => {
  console.log('🚀 Testing simple pause with LOCAL build...');
  console.log('📍 Using Playwright from:', require.resolve('./packages/playwright-core'));
  
  // Launch browser
  console.log('\n🚀 Launching browser...');
  const browser = await chromium.launch({ 
    headless: false
  });
  
  const page = await browser.newPage();
  await page.goto('https://suppliernet.walgreens.com/Login.jsp#');
  console.log('✅ Browser launched and navigated to example.com');
  
  // Pause and wait for manual interaction
  console.log('\n🎬 Calling page.pause()...');
  console.log('🛑 Script will hang here - you have 20 seconds to interact with the page');
  console.log('💡 Use the Playwright Inspector to resume when ready');
  
  try {
    // Set a timeout for auto-resume after 60 seconds
    const pausePromise = page.pause();
    
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        console.log('⏰ 20 seconds elapsed - auto-resuming...');
        page.resume();
      }, 10000);
    });
    
    // Wait for either manual resume or 60-second timeout
    await Promise.race([pausePromise, timeoutPromise]);
    
    console.log('✅ Pause completed!');
    
  } catch (error) {
    console.error('❌ Error during pause:', error.message);
  }
  
  console.log('\n🎯 Test completed - keeping browser open for inspection');
  console.log('✨ Close browser manually when done');
  
})().catch(error => {
  console.error('❌ Uncaught error:', error);
  process.exit(1);
}); 