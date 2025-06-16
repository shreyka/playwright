const { chromium } = require('./packages/playwright-core');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('🧪 Testing TWO cycles of page.pause() with outputFile parameter...');
  
  // Create output directory if it doesn't exist
  const outputDir = '/Users/shreyak/Documents/Simplex/playwright/output';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log('📁 Created output directory:', outputDir);
  }
  
  // Launch browser
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🌐 Navigating to test page...');
  await page.goto('https://example.com');
  
  // Wait a moment for the page to load
  await page.waitForTimeout(2000);
  
  // ========== FIRST CYCLE ==========
  console.log('\n🔄 ===== FIRST PAUSE/RESUME CYCLE =====');
  console.log('⏸️  Pausing page with outputFile (CYCLE 1)...');
  
  const outputFile = '/Users/shreyak/Documents/Simplex/playwright/output/test_outputfile_1.py';
  console.log('📝 Output file will be:', outputFile);
  
  const pausePromise1 = page.pause({
    outputFile: outputFile
  });
  
  // Set up clicks for first cycle and then resume after 3 seconds
  setTimeout(async () => {
    console.log('🖱️  Performing CYCLE 1 clicks...');
    try {
      // Click on the page title
      await page.click('h1');
      console.log('✅ CYCLE 1: Clicked h1');
      await page.waitForTimeout(1000);
      
      // Click on any paragraph
      await page.click('p');
      console.log('✅ CYCLE 1: Clicked p');
      await page.waitForTimeout(1000);
      
      console.log('▶️  Resuming page (CYCLE 1)...');
      await page.resume();
      console.log('✅ CYCLE 1: Resume called successfully!');
    } catch (error) {
      console.error('❌ CYCLE 1: Error during clicks/resume:', error.message);
    }
  }, 3000);
  
  // Wait for the first pause to complete
  await pausePromise1;
  console.log('✅ CYCLE 1: Pause/resume cycle completed successfully!');
  
  // Check files after first cycle
  const expectedPyFile = outputFile;
  const expectedXPathFile = outputFile.replace(/\.py$/, '_xpaths.json');
  
  console.log('\n🔍 CYCLE 1: Checking for generated files...');
  if (fs.existsSync(expectedPyFile)) {
    console.log('✅ CYCLE 1: Codegen file created!');
    const content = fs.readFileSync(expectedPyFile, 'utf8');
    console.log('📄 CYCLE 1: Codegen content length:', content.length);
    console.log('📄 CYCLE 1: Codegen content preview:', content.substring(0, 200) + '...');
  } else {
    console.log('❌ CYCLE 1: Codegen file NOT found');
  }
  
  if (fs.existsSync(expectedXPathFile)) {
    console.log('✅ CYCLE 1: XPath file created!');
    const content = fs.readFileSync(expectedXPathFile, 'utf8');
    console.log('📄 CYCLE 1: XPath content:', content);
  } else {
    console.log('❌ CYCLE 1: XPath file NOT found');
  }
  
  // Wait a bit between cycles
  await page.waitForTimeout(2000);
  
  // ========== SECOND CYCLE ==========
  console.log('\n🔄 ===== SECOND PAUSE/RESUME CYCLE =====');
  console.log('⏸️  Pausing page with outputFile (CYCLE 2)...');

  const outputFile2 = '/Users/shreyak/Documents/Simplex/playwright/output/test_outputfile_2.py';
  console.log('📝 Output file will be:', outputFile2);
  
  const pausePromise2 = page.pause({
    outputFile: outputFile2
  });
  
  // Set up different clicks for second cycle
  setTimeout(async () => {
    console.log('🖱️  Performing CYCLE 2 clicks...');
    try {
      // Click on different elements this time
      await page.click('a'); // Try to click a link
      console.log('✅ CYCLE 2: Clicked a (link)');
      await page.waitForTimeout(1000);
      
      // Click on the paragraph again
      await page.click('p');
      console.log('✅ CYCLE 2: Clicked p');
      await page.waitForTimeout(1000);
      
      // Click on h1 again
      await page.click('h1');
      console.log('✅ CYCLE 2: Clicked h1');
      await page.waitForTimeout(1000);
      
      console.log('▶️  Resuming page (CYCLE 2)...');
      await page.resume();
      console.log('✅ CYCLE 2: Resume called successfully!');
    } catch (error) {
      console.error('❌ CYCLE 2: Error during clicks/resume:', error.message);
    }
  }, 3000);
  
  // Wait for the second pause to complete
  await pausePromise2;
  console.log('✅ CYCLE 2: Pause/resume cycle completed successfully!');
  
  // Check files after second cycle
  console.log('\n🔍 CYCLE 2: Checking for generated files...');
  if (fs.existsSync(expectedPyFile)) {
    console.log('✅ CYCLE 2: Codegen file created!');
    const content = fs.readFileSync(expectedPyFile, 'utf8');
    console.log('📄 CYCLE 2: Codegen content length:', content.length);
    console.log('📄 CYCLE 2: Codegen content preview:', content.substring(0, 200) + '...');
  } else {
    console.log('❌ CYCLE 2: Codegen file NOT found');
  }
  
  if (fs.existsSync(expectedXPathFile)) {
    console.log('✅ CYCLE 2: XPath file created!');
    const content = fs.readFileSync(expectedXPathFile, 'utf8');
    console.log('📄 CYCLE 2: XPath content:', content);
  } else {
    console.log('❌ CYCLE 2: XPath file NOT found');
  }
  
  // Close browser
  await browser.close();
  
  console.log('\n🎉 Two-cycle test completed!');
  console.log('🔍 Summary: Check if CYCLE 2 files only contain clicks from the second cycle (should be cleared from first cycle)');
})().catch(console.error); 