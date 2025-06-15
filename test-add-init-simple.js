const { chromium } = require('playwright');

(async () => {
  console.log('🧪 Testing addInitScript without pause/resume...');
  
  // Launch browser
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('📝 Adding init script...');
  
  // Add initialization script that runs before any page loads
  await page.addInitScript(() => {
    // Click tracking and highlighting functionality
    let clickCount = 0;
    
    // Create a style element for our CSS
    const style = document.createElement('style');
    style.textContent = `
      .playwright-highlight {
        border: 3px solid red !important;
        box-shadow: 0 0 10px rgba(255, 0, 0, 0.5) !important;
        transition: all 0.3s ease !important;
      }
      
      .playwright-click-counter {
        position: fixed;
        top: 10px;
        right: 10px;
        background: red;
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-family: Arial, sans-serif;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      }
    `;
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeScript);
    } else {
      initializeScript();
    }
    
    function initializeScript() {
      // Add our styles to the page
      document.head.appendChild(style);
      
      // Create click counter display
      const counter = document.createElement('div');
      counter.className = 'playwright-click-counter';
      counter.textContent = `Clicks: ${clickCount}`;
      document.body.appendChild(counter);
      
      // Add click event listener to document
      document.addEventListener('click', (event) => {
        clickCount++;
        
        // Update counter
        counter.textContent = `Clicks: ${clickCount}`;
        
        // Log click details
        console.log(`%c[PLAYWRIGHT] Click #${clickCount}`, 'color: red; font-weight: bold;');
        console.log('Target element:', event.target);
        console.log('Element tag:', event.target.tagName);
        console.log('Element classes:', event.target.className);
        console.log('Click coordinates:', { x: event.clientX, y: event.clientY });
        console.log('---');
        
        // Highlight the clicked element
        highlightElement(event.target);
      });
      
      // Also highlight elements on hover for better visibility
      document.addEventListener('mouseover', (event) => {
        if (event.target !== document.body && event.target !== document.documentElement) {
          event.target.style.outline = '2px dashed orange';
        }
      });
      
      document.addEventListener('mouseout', (event) => {
        event.target.style.outline = '';
      });
      
      console.log('%c[PLAYWRIGHT] Init script loaded! Click tracking and highlighting active.', 
                  'color: green; font-weight: bold; font-size: 14px;');
    }
    
    function highlightElement(element) {
      // Remove previous highlights
      const prevHighlighted = document.querySelectorAll('.playwright-highlight');
      prevHighlighted.forEach(el => el.classList.remove('playwright-highlight'));
      
      // Add highlight to clicked element
      element.classList.add('playwright-highlight');
      
      // Remove highlight after 2 seconds
      setTimeout(() => {
        element.classList.remove('playwright-highlight');
      }, 2000);
    }
  });

  console.log('🌐 Navigating to test page...');
  await page.goto('https://example.com');
  
  // Wait a moment for the page to load
  await page.waitForTimeout(3000);
  
  console.log('🎯 Performing test clicks...');
  
  // Try to click on some elements if they exist
  try {
    await page.click('h1', { timeout: 5000 });
    console.log('✅ Successfully clicked h1');
    await page.waitForTimeout(1000);
    
    await page.click('p', { timeout: 5000 });
    console.log('✅ Successfully clicked p');
    await page.waitForTimeout(1000);
    
    await page.click('a', { timeout: 5000 });
    console.log('✅ Successfully clicked a');
    await page.waitForTimeout(1000);
  } catch (error) {
    console.log('⚠️  Some elements not found, but that\'s okay');
  }
  
  // Check if the init script is working by looking for the counter element
  console.log('🔍 Checking if init script worked...');
  const counterExists = await page.evaluate(() => {
    return !!document.querySelector('.playwright-click-counter');
  });
  
  if (counterExists) {
    console.log('✅ SUCCESS: Init script is working! Click counter is visible.');
  } else {
    console.log('❌ FAILURE: Init script did not work. Click counter is not visible.');
  }
  
  // Navigate to another page to test script persistence
  console.log('🌐 Testing script persistence on new page...');
  await page.goto('https://httpbin.org/html');
  await page.waitForTimeout(2000);
  
  // Check if the script still works on the new page
  const counterExistsOnNewPage = await page.evaluate(() => {
    return !!document.querySelector('.playwright-click-counter');
  });
  
  if (counterExistsOnNewPage) {
    console.log('✅ SUCCESS: Init script persisted across navigation!');
  } else {
    console.log('❌ FAILURE: Init script did not persist across navigation.');
  }
  
  console.log('🎉 Test completed. You can interact with the page manually if needed.');
  console.log('⏰ Keeping browser open for 10 seconds for manual testing...');
  
  // Wait 10 seconds before closing
  await page.waitForTimeout(10000);
  
  console.log('🚀 Closing browser...');
  await browser.close();
  
  console.log('✨ Test finished.');
})(); 