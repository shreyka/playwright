import re
from playwright.sync_api import Playwright, sync_playwright, expect


def run(playwright: Playwright) -> None:
    browser = playwright.chromium.launch(headless=False)
    context = browser.new_context()
    page = context.new_page()
    page.goto("https://suppliernet.walgreens.com/Login.jsp#")
    page.get_by_role("link", name="Login").click()
    page.get_by_role("textbox", name="Enter your OneID").click()
    page.get_by_role("textbox", name="Enter your Password").click()
    page.get_by_role("textbox", name="Enter your OneID").click()
    page.goto("https://www.browserscan.net/")
    with page.expect_popup() as page1_info:
        page.get_by_role("navigation").get_by_role("link", name="blog").click()
    page1 = page1_info.value
    page1.get_by_role("link", name="Antidetect Browsers", exact=True).click()
    page1.close()
    page.close()

    # ---------------------
    context.close()
    browser.close()


with sync_playwright() as playwright:
    run(playwright)
