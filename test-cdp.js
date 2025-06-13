// Use local Playwright build
const { chromium } = require('./packages/playwright-core');

(async () => {
  console.log('🚀 Testing CDP cross-session resume with LOCAL build...');
  console.log('📍 Using Playwright from:', require.resolve('./packages/playwright-core'));
  
  // === STEP 1: Launch browser with CDP enabled ===
  const browser1 = await chromium.launch({ 
    headless: false,
    args: ['--remote-debugging-port=9222']  // Enable CDP
  });
  
  const page1 = await browser1.newPage();
  await page1.goto('https://example.com');

  console.log('\n🎬 === LAUNCHING AND PAUSING IN SESSION 1 ===');
  console.log('📹 Calling page.pause() - should auto-open recorder...');
  
  // Start pause in background (don't await yet)
  const pausePromise = page1.pause();
  
  // Wait a bit for pause to initialize
  await page1.waitForTimeout(3000);
  console.log('✅ Pause started in Session 1, recorder should be active');
  
  // === STEP 2: Connect via CDP from "different session" ===
  console.log('\n🔗 === CONNECTING VIA CDP IN SESSION 2 ===');
  let browser2;
  let resumeSuccess = false;
  
  try {
    // Connect to the existing browser via CDP
    browser2 = await chromium.connectOverCDP('http://localhost:9222');
    console.log('✅ Successfully connected via CDP');
    
    // Get the existing context and page
    const context2 = browser2.contexts()[0];
    const page2 = context2.pages()[0];
    
    console.log('📄 Found page via CDP:', await page2.url());
    
    // === STEP 3: Try to resume from CDP session ===
    console.log('\n⏭️  === ATTEMPTING RESUME FROM CDP SESSION ===');
    console.log('🔧 Calling page.resume() from CDP connection...');
    
    // This should now work with our fix!
    await page2.resume();
    console.log('✅ RESUME SUCCESS! Called page.resume() from CDP session!');
    resumeSuccess = true;
    
  } catch (error) {
    console.error('❌ Error during CDP resume:', error.message);
  }
  
  // === STEP 4: Verify original pause completes ===
  console.log('\n🎯 === VERIFYING PAUSE COMPLETION ===');
  try {
    await pausePromise;
    console.log('🎉 Original pause completed! Recording should be stopped.');
  } catch (error) {
    console.error('❌ Error waiting for pause completion:', error.message);
  }
  
  // === CLEANUP ===
  console.log('\n🧹 === CLEANUP ===');
  
  if (browser2) {
    try {
      await browser2.close();
      console.log('✅ CDP browser connection closed');
    } catch (error) {
      console.error('⚠️  Error closing CDP browser:', error.message);
    }
  }
  
  try {
    await browser1.close();
    console.log('✅ Original browser closed');
  } catch (error) {
    console.error('⚠️  Error closing original browser:', error.message);
  }
  
  // === RESULTS ===
  console.log('\n🎯 === TEST RESULTS ===');
  if (resumeSuccess) {
    console.log('🎊 SUCCESS! CDP cross-session resume worked!');
    console.log('✨ Fix is working - recorder stopped from different session');
  } else {
    console.log('❌ FAILED! CDP cross-session resume did not work');
    console.log('🔍 Need to debug the fix further');
  }
})(); 