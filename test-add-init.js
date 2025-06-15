const { chromium } = require('playwright');

(async () => {
  // === DEBUG: Check which Playwright build is being used ===
  console.log('🔍 === PLAYWRIGHT BUILD DEBUG INFO ===');
  console.log('📍 Playwright module path:', require.resolve('playwright'));
  console.log('📍 Playwright core path:', require.resolve('playwright-core'));
  
  try {
    const playwrightPackage = require('playwright/package.json');
    console.log('📦 Playwright version:', playwrightPackage.version);
  } catch (error) {
    console.log('❌ Could not read playwright package.json:', error.message);
  }
  
  try {
    const chromiumPackage = require('playwright-core/package.json');
    console.log('🌐 Playwright-core version:', chromiumPackage.version);
  } catch (error) {
    console.log('❌ Could not read playwright-core package.json:', error.message);
  }
  
  console.log('🔧 Node.js version:', process.version);
  console.log('📂 Current working directory:', process.cwd());
  console.log('==========================================\n');
  
  // Launch browser
  const browser = await chromium.launch({ 
    headless: false, // Keep browser visible
    slowMo: 100 // Slow down actions for better visibility
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

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

  // Navigate to a test page (you can change this URL)
  console.log('Navigating to test page...');
  await page.goto('https://example.com');
  
  // Wait a moment for the page to load
  await page.waitForTimeout(2000);
  
  // Perform some test clicks to demonstrate the functionality
  console.log('Performing test interactions...');
  
  // Try to click on some elements if they exist
  try {
    await page.click('h1', { timeout: 5000 });
    await page.waitForTimeout(1000);
    
    await page.click('p', { timeout: 5000 });
    await page.waitForTimeout(1000);
    
    await page.click('a', { timeout: 5000 });
    await page.waitForTimeout(1000);
  } catch (error) {
    console.log('Some elements not found, continuing...');
  }
  
  // You can also navigate to other pages to test that the script persists
  console.log('Navigating to another page to test script persistence...');
  await page.goto('https://httpbin.org/html');
  await page.waitForTimeout(2000);
  
  // Try clicking elements on the new page
  try {
    await page.click('h1');
    await page.waitForTimeout(1000);
    await page.click('p');
  } catch (error) {
    console.log('Elements not found on second page, continuing...');
  }
  
  console.log('Waiting 30 seconds before pausing...');
  console.log('You can manually click elements on the page to see the highlighting and logging in action!');
  
  // Wait for 30 seconds
  await page.waitForTimeout(30000);
  
  console.log('30 seconds elapsed - pausing execution...');
  console.log('The browser will remain open. Press Ctrl+C to close it.');
  
  // Pause the execution (browser stays open)
  await page.pause();
  
  // This code will only run after you resume from the pause
  await browser.close();
})();