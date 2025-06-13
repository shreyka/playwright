import asyncio
import os
from playwright.async_api import async_playwright

async def clear_recorder_state(page):
    """Clear the recorder state by dispatching the clear event"""
    await page.evaluate("""() => {
        window.dispatch({ event: 'clear' });
    }""")

async def test_cdp_pause_resume():
    print('🚀 Testing CDP connection pause/resume using Python Playwright...')
    print('PLAYWRIGHT_DRIVER_PATH:', os.environ.get('PLAYWRIGHT_DRIVER_PATH', 'NOT SET'))
    
    async with async_playwright() as p:
        
        # === STEP 2: Connect via CDP to localhost:9222 ===
        print('\n🔌 === STEP 2: Connect via CDP to localhost:9222 ===')
        cdp_endpoint = 'ws://127.0.0.1:9222/devtools/browser/a834b361-ce07-43db-81bd-39f716037d53'
        
        try:
            cdp_browser = await p.chromium.connect_over_cdp(cdp_endpoint)
            print('✅ Connected via CDP!')
            
            # Get the existing context and page
            cdp_context = cdp_browser.contexts[0]
            print('got context')
            cdp_page = cdp_context.pages[0]
            
            
            # === STEP 3: Test first pause/resume via CDP connection ===
            print('\n🎬 === STEP 3: First pause/resume cycle ===')
            print('🧹 Clearing recorder state before first pause...')
            await clear_recorder_state(cdp_page)
            print('📹 Calling first page.pause() via CDP connection...')
            
            # Start first pause in background
            pause_task = asyncio.create_task(cdp_page.pause())
            
            # Wait a bit, then try to resume
            await asyncio.sleep(5)
            print('⏭️  Calling first page.resume() via CDP connection...')
            
            try:
                await cdp_page.resume()
                print('✅ First CDP page.resume() called successfully!')
            except Exception as error:
                print(f'❌ Error on first CDP resume: {error}')
            
            # Wait for first pause to complete
            await asyncio.sleep(15)
            await pause_task
            print('🎉 First CDP pause/resume cycle completed!')
            
            # Test actions after first resume
            print('\n🔍 Testing actions after first resume...')
            await cdp_page.goto('https://example.com')
            print('✅ Navigation to example.com completed!')
            await cdp_page.wait_for_timeout(2000)
            
            # === STEP 4: Test second pause/resume via CDP connection ===
            print('\n🎬 === STEP 4: Second pause/resume cycle ===')
            print('🧹 Clearing recorder state before second pause...')
            await clear_recorder_state(cdp_page)
            print('📹 Calling second page.pause() via CDP connection...')
            
            # Start second pause in background
            pause_task = asyncio.create_task(cdp_page.pause())
            
            # Wait a bit, then try to resume
            await asyncio.sleep(5)
            print('⏭️  Calling second page.resume() via CDP connection...')
            
            try:
                await cdp_page.resume()
                print('✅ Second CDP page.resume() called successfully!')
            except Exception as error:
                print(f'❌ Error on second CDP resume: {error}')
            
            # Wait for second pause to complete
            await asyncio.sleep(15)
            await pause_task
            print('🎉 Second CDP pause/resume cycle completed!')
            
            # Test actions after second resume
            print('\n🔍 Testing actions after second resume...')
            await cdp_page.goto('https://www.browserscan.net')
            print('✅ Navigation to browserscan.net completed!')
            
            await cdp_page.wait_for_timeout(10000)
            
            final_url = await cdp_page.url()
            print('📍 Final URL:', final_url)
            
            # === CLEANUP ===
            print('\n🧹 === CLEANUP ===')
            await cdp_browser.close()
            
        except Exception as error:
            print(f'❌ CDP Connection failed: {error}')
        
        
        print('\n🎯 === CDP TEST COMPLETED ===')
        print('✨ CDP connection pause/resume test finished!')

if __name__ == "__main__":
    asyncio.run(test_cdp_pause_resume()) 