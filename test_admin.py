from playwright.sync_api import sync_playwright
import os

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # 1. 대시보드 접속
    print("=== 1. 대시보드 접속 ===")
    page.goto('https://www.bizen.co.kr/admin/')
    page.wait_for_load_state('networkidle')
    print(f"URL: {page.url}")
    print(f"Title: {page.title()}")
    page.screenshot(path='screenshot_1_dashboard.png', full_page=True)

    # 2. 사이드바 링크 확인
    print("\n=== 2. 사이드바 링크 확인 ===")
    links = page.locator('.sidebar-nav a').all()
    for link in links:
        href = link.get_attribute('href')
        text = link.inner_text().strip()
        print(f"  {text}: {href}")

    # 3. 접수내역 클릭
    print("\n=== 3. 접수내역 클릭 ===")
    page.click('text=접수내역')
    page.wait_for_load_state('networkidle')
    print(f"URL: {page.url}")
    print(f"Title: {page.title()}")
    page.screenshot(path='screenshot_2_leads.png', full_page=True)

    # 404 체크
    if '404' in page.content() or 'NOT_FOUND' in page.content():
        print("*** 404 ERROR DETECTED ***")

    # 4. 직접 URL 접근 테스트
    print("\n=== 4. 직접 URL 접근 테스트 ===")
    test_urls = [
        'https://www.bizen.co.kr/admin/leads.html',
        'https://www.bizen.co.kr/admin/board.html',
        'https://www.bizen.co.kr/admin/analytics.html',
        'https://www.bizen.co.kr/admin/settings.html',
    ]

    for url in test_urls:
        page.goto(url)
        page.wait_for_load_state('networkidle')
        status = "404 ERROR" if ('404' in page.content() or 'NOT_FOUND' in page.content()) else "OK"
        print(f"  {url} -> {status}")

    browser.close()
    print("\n=== 테스트 완료 ===")
