from playwright.sync_api import sync_playwright
import re

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # 도메인에서 admin 페이지 접속
    print("=== Domain Admin Page ===")
    page.goto('https://www.bizen.co.kr/admin/')
    page.wait_for_load_state('networkidle')

    # 페이지 소스에서 components.js 로드 확인
    html = page.content()

    # sidebar-nav 내의 링크 찾기
    sidebar_links = page.locator('.sidebar-nav a').all()
    print(f"\nSidebar links ({len(sidebar_links)} found):")
    for link in sidebar_links:
        href = link.get_attribute('href')
        text = link.inner_text().strip().replace('\n', ' ')
        print(f"  {text}: {href}")

    # components.js 스크립트 태그 찾기
    scripts = page.locator('script[src*="components"]').all()
    print(f"\nComponents.js scripts: {len(scripts)}")
    for s in scripts:
        print(f"  src: {s.get_attribute('src')}")

    browser.close()
