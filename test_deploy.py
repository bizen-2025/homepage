from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # 최신 배포 URL에서 components.js 확인
    print("=== Latest Deploy URL components.js ===")
    url = 'https://bizen-homepage-23ic8fje3-bizen-2025s-projects.vercel.app/js/components.js'
    page.goto(url)
    page.wait_for_load_state('networkidle')

    # 페이지 전체 텍스트 가져오기
    text = page.inner_text('body') if page.locator('body').count() > 0 else page.content()

    # href 패턴 찾기
    import re
    hrefs = re.findall(r'href=["\']([^"\']*)["\']', page.content())
    print(f"Found hrefs: {hrefs[:10]}")

    # /admin 관련 링크 찾기
    admin_links = [h for h in hrefs if 'admin' in h.lower() or 'leads' in h.lower() or 'board' in h.lower()]
    print(f"Admin links: {admin_links}")

    browser.close()
