const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable recorder with addVariable flag
  await page.evaluate(() => {
    window.enableRecorder({ 
      language: 'javascript',
      mode: 'recording',
      addVariable: true  // This enables the automatic fill variable dialog
    });
  });

  // Create a simple test page
  await page.setContent(`
    <html>
      <body>
        <h1>Test Add Variable Button</h1>
        <button id="btn1">Button 1</button>
        <button id="btn2">Button 2</button>
        <input type="text" id="input1" placeholder="Input 1">
        <div id="log" style="border: 1px solid #ccc; padding: 10px; margin-top: 20px; height: 200px; overflow-y: auto;"></div>
      </body>
    </html>
  `);

  // Add logging to the page
  await page.evaluate(() => {
    const log = document.getElementById('log');
    
    // Override console.log to also show in the page
    const originalLog = console.log;
    console.log = function(...args) {
      originalLog.apply(console, args);
      const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
      const entry = document.createElement('div');
      entry.style.fontSize = '12px';
      entry.style.marginBottom = '4px';
      entry.textContent = new Date().toISOString().substr(11, 12) + ' ' + msg;
      log.appendChild(entry);
      log.scrollTop = log.scrollHeight;
    };
  });

  console.log('Test page loaded. Instructions:');
  console.log('1. Click on Button 1');
  console.log('2. Click "ADD VARIABLE" button - should create variable for Button 1 click');
  console.log('3. Fill Input 1');
  console.log('4. Click "ADD VARIABLE" button - should create variable for Input 1 fill');
  console.log('5. Click on Button 2');
  console.log('6. Click "ADD VARIABLE" button - should create variable for Button 2 click');
  console.log('');
  console.log('Watch both browser DevTools console and the log area on the page');
  
  // Keep browser open
  await new Promise(() => {});
})(); 