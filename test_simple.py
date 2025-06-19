#!/usr/bin/env python3
import asyncio
import sys
import os

# Add the local Playwright build to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'packages', 'playwright', 'src'))

from playwright.async_api import async_playwright

async def main():
    print("🚀 Testing simple pause with LOCAL build...")
    
    async with async_playwright() as p:
        # Launch browser
        print("\n🚀 Launching browser...")
        browser = await p.chromium.launch(headless=False)
        
        page = await browser.new_page()
        await page.goto("https://suppliernet.walgreens.com/Login.jsp#")
        print("✅ Browser launched and navigated to Walgreens")
        
        # Pause and wait for manual interaction
        print("\n🎬 Calling page.pause()...")
        print("🛑 Script will hang here - you have 10 seconds to interact with the page")
        print("💡 Use the Playwright Inspector to resume when ready")
        
        try:
            # Create pause and timeout tasks
            pause_task = asyncio.create_task(page.pause())
            
            async def auto_resume():
                await asyncio.sleep(10)
                print("⏰ 10 seconds elapsed - auto-resuming...")
                await page.resume()
            
            timeout_task = asyncio.create_task(auto_resume())
            
            # Wait for either manual resume or timeout
            done, pending = await asyncio.wait(
                [pause_task, timeout_task], 
                return_when=asyncio.FIRST_COMPLETED
            )
            
            # Cancel any remaining tasks
            for task in pending:
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
            
            print("✅ Pause completed!")
            
        except Exception as error:
            print(f"❌ Error during pause: {error}")
        
        print("\n🎯 Test completed - keeping browser open for inspection")
        print("✨ Close browser manually when done")
        
        # Keep the script running so browser stays open
        try:
            await asyncio.sleep(300)  # Keep alive for 5 minutes
        except KeyboardInterrupt:
            print("\n👋 Closing browser...")
            await browser.close()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n❌ Script interrupted")
        sys.exit(1)
    except Exception as error:
        print(f"❌ Error: {error}")
        sys.exit(1) 