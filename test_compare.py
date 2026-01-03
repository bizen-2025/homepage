from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # 1. 최신 배포 URL 테스트
    print("=== 1. Latest Deploy URL ===")
    page.goto('https://bizen-homepage-mg8f44nc1-bizen-2025s-projects.vercel.app/js/components.js')
    content1 = page.content()
    if '/admin/leads.html' in content1:
        print("Deploy URL: /admin/leads.html (CORRECT)")
    elif 'leads.html' in content1:
        print("Deploy URL: leads.html (WRONG - relative)")
    else:
        print("Deploy URL: Unknown")

    # 2. 도메인 URL 테스트
    print("\n=== 2. Domain URL ===")
    page.goto('https://www.bizen.co.kr/js/components.js')
    content2 = page.content()
    if '/admin/leads.html' in content2:
        print("Domain URL: /admin/leads.html (CORRECT)")
    elif 'leads.html' in content2:
        print("Domain URL: leads.html (WRONG - relative)")
    else:
        print("Domain URL: Unknown")

    # 3. 직접 admin/leads.html 접근 테스트
    print("\n=== 3. Direct URL Access ===")
    page.goto('https://www.bizen.co.kr/admin/leads.html')
    page.wait_for_load_state('networkidle')
    if '404' in page.content() or 'NOT_FOUND' in page.content():
        print("/admin/leads.html: 404 ERROR")
    else:
        print(f"/admin/leads.html: OK (title: {page.title()})")

    browser.close()
