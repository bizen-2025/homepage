from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    urls = [
        'https://www.bizen.co.kr/admin/index.html',
        'https://www.bizen.co.kr/admin/leads.html',
        'https://www.bizen.co.kr/admin/board.html',
        'https://www.bizen.co.kr/admin/analytics.html',
        'https://www.bizen.co.kr/admin/settings.html',
    ]

    for url in urls:
        page.goto(url)
        page.wait_for_load_state('networkidle')
        content = page.content()
        if '404' in content or 'NOT_FOUND' in content:
            status = "404"
        else:
            status = "OK"
        print(f"{url.split('/')[-1]}: {status}")

    browser.close()
