import asyncio
import os
import playwright
from playwright.async_api import async_playwright

async def main():
    print('🧪 Testing page.pause() with outputFile parameter...')
    print(f'📍 Playwright location: {playwright.__file__}')
    
    # Create output directory if it doesn't exist
    output_dir = '/Users/shreyak/Documents/Simplex/playwright/output'
    os.makedirs(output_dir, exist_ok=True)
    
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(
            headless=False,
            slow_mo=100
        )
        
        context = await browser.new_context()
        page = await context.new_page()

        print('🌐 Navigating to test page...')
        await page.goto('https://www.ycombinator.com')
        
        # Wait a moment for the page to load
        await page.wait_for_timeout(2000)
        
        print('⏸️  Pausing page with outputFile...')
        
        # Test the new outputFile functionality
        output_file = '/Users/shreyak/Documents/Simplex/playwright/output/test_python_output.py'
        print(f'📝 Output file will be: {output_file}')
        
        # Create a task for the pause
        pause_task = asyncio.create_task(page.pause(output=output_file))
        
        # Set up resume to be called after 10 seconds
        async def resume_after_delay():
            await asyncio.sleep(10)
            print('▶️  Resuming page...')
            try:
                await page.resume()
                print('✅ Resume called successfully!')
            except Exception as error:
                print(f'❌ Error on resume: {error}')
        
        # Start the resume task
        resume_task = asyncio.create_task(resume_after_delay())
        
        # Wait for the pause to complete (when resume is called)
        await pause_task
        
        print('✅ Pause/resume cycle completed successfully!')
        print('📁 Generated code should be saved to: ./test-output.py')
        
        # Check if file was created
        if os.path.exists(output_file):
            print('✅ Output file was created!')
            with open(output_file, 'r') as f:
                content = f.read()
                print(f'📄 File content length: {len(content)} characters')
                print(f'📄 File content preview: {content[:200]}...')
        else:
            print('❌ Output file was NOT created')
        
        # Close browser
        await browser.close()
        
        print('🎉 Test completed!')

if __name__ == '__main__':
    asyncio.run(main()) 