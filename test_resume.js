const { chromium } = require('./packages/playwright-core');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('https://example.com');
  
  console.log('=== First pause ===');
  console.log('About to pause - the browser will pause here');
  const pausePromise1 = page.pause(); // This will pause the execution and start recording
  
  // Simulate calling resume after a delay
  setTimeout(async () => {
    console.log('Calling page.resume() to continue execution');
    try {
      await page.resume();
      console.log('Resume call completed - recording should still be active');
    } catch (error) {
      console.error('Error calling resume:', error);
    }
  }, 3000);
  
  await pausePromise1;
  console.log('First pause resolved - script continued');
  
  // Do some actions
  await page.click('h1');
  console.log('Clicked on h1 element');
  
  console.log('=== Second pause ===');
  console.log('About to pause again - recording should still be active');
  const pausePromise2 = page.pause(); // This should pause again without stopping recording
  
  // Simulate calling resume after a delay
  setTimeout(async () => {
    console.log('Calling page.resume() again');
    try {
      await page.resume();
      console.log('Second resume call completed');
    } catch (error) {
      console.error('Error calling resume:', error);
    }
  }, 3000);
  
  await pausePromise2;
  console.log('Second pause resolved - script continued');
  
  // Do more actions
  await page.click('p');
  console.log('Clicked on p element');
  
  console.log('Test completed - recording should still be active');
  await browser.close();
})(); 