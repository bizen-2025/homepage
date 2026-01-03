from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    urls = [
        'https://www.bizen.co.kr/admin/analytics.html',
        'https://www.bizen.co.kr/admin/leads.html',
        'https://www.bizen.co.kr/admin/board.html',
    ]

    print("=== 5회 반복 테스트 ===\n")

    for i in range(5):
        print(f"--- 테스트 #{i+1} ---")
        page = browser.new_page()

        for url in urls:
            page.goto(url, wait_until='networkidle')
            content = page.content()
            name = url.split('/')[-1]

            if '404' in content or 'NOT_FOUND' in content:
                print(f"  {name}: 404 ERROR")
            else:
                print(f"  {name}: OK")

        page.close()
        time.sleep(1)

    browser.close()
    print("\n=== 테스트 완료 ===")
