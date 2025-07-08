const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable recorder
  await page._browserContext._channel.enableRecorder({
    mode: 'recording',
    language: 'javascript',
    testIdAttributeName: undefined,
    handleSIGINT: false,
    outputFile: "test-output.js",
    addVariable: true  // This flag no longer triggers automatic variable dialog
  });

  // Navigate to a test page
  await page.goto('data:text/html,<html><body><input id="username" placeholder="Username"><input id="password" type="password" placeholder="Password"><button>Login</button></body></html>');

  console.log('Test setup complete.');
  console.log('1. Fill in the username field - NO automatic variable dialog should appear');
  console.log('2. Click on another element - NO automatic variable dialog should appear');
  console.log('3. Click the "ADD VARIABLE" button in the recorder bar to manually create a variable');
  console.log('');
  console.log('The generated code will be in test-output.js');
})(); 