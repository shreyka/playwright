import asyncio
import sys
sys.path.insert(0, './packages/playwright-core')
from playwright.async_api import async_playwright

async def test_python_resume():
    print('🐍 Testing Python page.resume()...')
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context()
        page = await context.new_page()
        
        await page.goto('https://example.com')
        print('✅ Page loaded')
        
        print('⏸️  Calling page.pause()...')
        # Start pause in background
        pause_task = asyncio.create_task(page.pause())
        
        # Resume after 3 seconds
        await asyncio.sleep(3)
        print('▶️  Calling page.resume()...')
        try:
            await page.resume()
            print('✅ Python resume completed!')
        except Exception as e:
            print(f'❌ Python resume failed: {e}')
            
        # Wait for pause to complete
        await pause_task
        print('🎉 Python pause/resume completed!')
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_python_resume()) 