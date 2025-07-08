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

  // Create a simple test page with form
  await page.setContent(`
    <html>
      <body>
        <h1>Test Add Variable Button</h1>
        <form>
          <input type="text" id="username" placeholder="Username">
          <input type="password" id="password" placeholder="Password">
          <button type="button" id="login">Login</button>
          <button type="button" id="cancel">Cancel</button>
        </form>
        <div id="result"></div>
      </body>
    </html>
  `);

  console.log('Test page loaded. Instructions:');
  console.log('1. Click on elements and fill inputs');
  console.log('2. Look for "ADD VARIABLE" button in the recorder bar');
  console.log('3. Click "ADD VARIABLE" to create a variable for the last action');
  console.log('4. For fill actions, the variable will be the text value');
  console.log('5. For click actions, the variable will be the selector');
  console.log('');
  console.log('Watch the browser DevTools console for debug logs');
  
  // Keep browser open
  await new Promise(() => {});
})(); 