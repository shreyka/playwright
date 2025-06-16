import re
from playwright.sync_api import Playwright, sync_playwright, expect


def run(playwright: Playwright) -> None:
    browser = playwright.chromium.launch(headless=False)
    context = browser.new_context()
    page.locator("iframe[title=\"Intercom\"]").content_frame.get_by_role("link", name="Launches", exact=True).click()
    page.goto("https://www.browserscan.net/")
    page.locator("iframe[name=\"googlefcLoaded\"]").content_frame.get_by_role("heading", name="Best BrowserScan Fingerprint").click()
    page.locator("iframe[name=\"googlefcLoaded\"]").content_frame.get_by_text("208.80.39.89", exact=True).click()
    page.close()

    # ---------------------
    context.close()
    browser.close()


with sync_playwright() as playwright:
    run(playwright)
