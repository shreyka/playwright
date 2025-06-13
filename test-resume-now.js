// Use local Playwright build
const { chromium } = require('./packages/playwright-core');

(async () => {
  console.log('🚀 Testing CDP connection pause/resume using LOCAL build...');
  console.log('📍 Using Playwright from:', require.resolve('./packages/playwright-core'));
  
  // === STEP 1: Launch browser with CDP enabled ===
  console.log('\n🚀 === STEP 1: Launch browser with CDP enabled ===');
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--remote-debugging-port=9222']  // Enable CDP on port 9222
  });
  
  const page = await browser.newPage();
  await page.goto('https://example.com');
  console.log('✅ Browser launched with CDP on port 9222');
  
  // === STEP 2: Connect via CDP to localhost:9222 ===
  console.log('\n🔌 === STEP 2: Connect via CDP to localhost:9222 ===');
  const cdpEndpoint = 'http://localhost:9222';
  
  try {
    const cdpBrowser = await chromium.connectOverCDP(cdpEndpoint);
    console.log('✅ Connected via CDP!');
    
    // Get the existing context and page
    const cdpContext = cdpBrowser.contexts()[0];
    const cdpPage = cdpContext.pages()[0];
    
    console.log('📄 CDP Page URL:', await cdpPage.url());
    
    // === STEP 3: First pause/resume cycle ===
    console.log('\n🎬 === STEP 3: First pause/resume cycle ===');
    console.log('📹 Calling first page.pause() via CDP connection...');
    
    const firstPausePromise = cdpPage.pause();
    
    // Test resume after 5 seconds
    setTimeout(async () => {
      console.log('⏭️  Calling first page.resume() via CDP connection...');
      try {
        await cdpPage.resume();
        console.log('✅ First CDP page.resume() called successfully!');
      } catch (error) {
        console.error('❌ Error on first CDP resume:', error.message);
      }
    }, 5000);
    
    // Wait for first pause to complete
    await firstPausePromise;
    console.log('🎉 First CDP pause/resume cycle completed!');
    
    // Test actions after first resume
    console.log('\n🔍 Testing actions after first resume...');
    await cdpPage.goto('https://gmail.com');
    console.log('✅ Navigation to gmail.com completed!');
    await cdpPage.waitForTimeout(2000);
    
    // === STEP 4: Second pause/resume cycle ===
    console.log('\n🎬 === STEP 4: Second pause/resume cycle ===');
    console.log('📹 Calling second page.pause() via CDP connection...');
    
    const secondPausePromise = cdpPage.pause();
    
    // Test resume after 5 seconds
    setTimeout(async () => {
      console.log('⏭️  Calling second page.resume() via CDP connection...');
      try {
        await cdpPage.resume();
        console.log('✅ Second CDP page.resume() called successfully!');
      } catch (error) {
        console.error('❌ Error on second CDP resume:', error.message);
      }
    }, 15000);
    
    // Wait for second pause to complete
    await secondPausePromise;
    console.log('🎉 Second CDP pause/resume cycle completed!');
    
    // Test actions after second resume
    console.log('\n🔍 Testing actions after second resume...');
    await cdpPage.goto('https://www.browserscan.net');
    console.log('✅ Navigation to browserscan.net completed!');
    
    await cdpPage.waitForTimeout(10000);
    
    const finalUrl = await cdpPage.url();
    console.log('📍 Final URL:', finalUrl);
    
    // === CLEANUP ===
    console.log('\n🧹 === CLEANUP ===');
    await cdpBrowser.close();
    
  } catch (error) {
    console.error('❌ CDP Connection failed:', error.message);
  }
  
  await browser.close();
  
  console.log('\n🎯 === CDP TEST COMPLETED ===');
  console.log('✨ CDP connection pause/resume test finished!');
})(); 