"""Iteration 16 UI regression Playwright body.
Run with MCP browser automation against https://expo-book-cleaning.preview.emergentagent.com.
Covers home, admin tabs, business save persistence, history send-review notice, cleaner check-in/job controls, and quote form selectors.
"""
# This file records the test flow executed via mcp_browser_automation.
# It is intentionally written as an async Playwright script body; the MCP tool injects `page`.

try:
    await page.set_viewport_size({"width": 1920, "height": 1080})
    page.set_default_timeout(25000)
    await page.goto('https://expo-book-cleaning.preview.emergentagent.com', wait_until='domcontentloaded', timeout=25000)
    await page.wait_for_selector('[data-testid="hero-title"]')
    await page.evaluate("""async () => {
        localStorage.clear();
        localStorage.setItem('tidyups_last_quote', JSON.stringify({name:'QA Tester', phone:'7805559999', service_type:'Deep Cleaning', city:'Edmonton', province:'Alberta', saved_at:new Date().toISOString()}));
    }""")
    await page.reload(wait_until='domcontentloaded', timeout=25000)
    for tid in ['hero-title', 'stats-row', 'home-cta-quote', 'book-again-card']:
        await page.wait_for_selector(f'[data-testid="{tid}"]')

    await page.goto('https://expo-book-cleaning.preview.emergentagent.com/admin', wait_until='domcontentloaded', timeout=25000)
    if await page.locator('[data-testid="admin-logout"]').count() > 0:
        await page.locator('[data-testid="admin-logout"]').click(force=True)
    await page.wait_for_selector('[data-testid="admin-password-input"]')
    await page.fill('[data-testid="admin-password-input"]', 'tidyups2026')
    await page.locator('[data-testid="admin-login-btn"]').click(force=True)
    for tid in ['admin-tab-leads','admin-tab-history','admin-tab-images','admin-tab-business','admin-tab-team']:
        await page.wait_for_selector(f'[data-testid="{tid}"]')

    await page.locator('[data-testid="admin-tab-images"]').click(force=True)
    for tid in ['admin-image-label','admin-image-upload','admin-image-row-0','admin-image-fit-0','admin-image-up-0','admin-image-down-0','admin-image-delete-0']:
        await page.wait_for_selector(f'[data-testid="{tid}"]')

    await page.locator('[data-testid="admin-tab-team"]').click(force=True)
    for tid in ['admin-pin-input','admin-pin-save','admin-team-view-list','admin-team-view-map','admin-cleaner-row-0','admin-cleaner-track-0','admin-cleaner-delete-0']:
        await page.wait_for_selector(f'[data-testid="{tid}"]')
    await page.locator('[data-testid="admin-team-view-map"]').click(force=True)
    await page.wait_for_timeout(800)
    await page.locator('[data-testid="admin-team-view-list"]').click(force=True)

    await page.locator('[data-testid="admin-tab-business"]').click(force=True)
    for tid in ['admin-logo-preview','admin-biz-phone','admin-biz-tollfree','admin-biz-tollfree-num','admin-biz-address','admin-biz-city','admin-biz-website','admin-biz-review-url','admin-biz-hours-day-0','admin-pw-new','admin-biz-save']:
        await page.wait_for_selector(f'[data-testid="{tid}"]')
    await page.fill('[data-testid="admin-biz-review-url"]', 'https://g.page/r/ui-save-iteration-16')
    await page.locator('[data-testid="admin-biz-save"]').click(force=True)
    await page.wait_for_selector('[data-testid="admin-biz-success"]')

    await page.locator('[data-testid="admin-tab-history"]').click(force=True)
    await page.wait_for_selector('[data-testid="history-cleaner-filter"]')
    if await page.locator('[data-testid^="history-send-review-"]').count() > 0:
        await page.locator('[data-testid^="history-send-review-"]').first.click(force=True)
        await page.wait_for_selector('[data-testid="history-notice"]')

    await page.goto('https://expo-book-cleaning.preview.emergentagent.com/cleaner', wait_until='domcontentloaded', timeout=25000)
    if await page.locator('[data-testid="cleaner-signout"]').count() > 0:
        await page.locator('[data-testid="cleaner-signout"]').click(force=True)
    await page.fill('[data-testid="cleaner-name-input"]', 'TEST_UI_Cleaner_4ea148')
    await page.fill('[data-testid="cleaner-pin-input"]', '1234')
    await page.locator('[data-testid="cleaner-checkin-btn"]').click(force=True)
    await page.wait_for_selector('[data-testid="cleaner-status"]')
    for tid in ['cleaner-photo-add-before','cleaner-photo-add-after','cleaner-job-on_the_way-0','cleaner-job-cleaning-0','cleaner-job-done-0']:
        await page.wait_for_selector(f'[data-testid="{tid}"]')
    await page.locator('[data-testid="cleaner-job-on_the_way-0"]').click(force=True)
    await page.locator('[data-testid="cleaner-job-cleaning-0"]').click(force=True)
    await page.locator('[data-testid="cleaner-signout"]').click(force=True)

    await page.goto('https://expo-book-cleaning.preview.emergentagent.com/quote', wait_until='domcontentloaded', timeout=25000)
    await page.wait_for_selector('[data-testid="input-name"]')
    # Expected per review request: quote-submit-btn. Actual observed selector: quote-submit.
    quote_submit_btn_count = await page.locator('[data-testid="quote-submit-btn"]').count()
    quote_submit_count = await page.locator('[data-testid="quote-submit"]').count()
    print({'quote-submit-btn': quote_submit_btn_count, 'quote-submit': quote_submit_count})
    for tid, option in [('select-service','Home Cleaning'),('select-property','House'),('select-bedrooms','1'),('select-bathrooms','1'),('select-province','Alberta')]:
        await page.locator(f'[data-testid="{tid}"]').click(force=True)
        await page.wait_for_timeout(200)
        await page.locator(f'[data-testid="option-{option}"]').first.click(force=True)
        await page.wait_for_timeout(200)
    print('ITERATION_16_UI_TEST_SUCCESS_WITH_SELECTOR_MISMATCH')
except Exception as e:
    print(f'ITERATION_16_UI_TEST_FAILURE: {e}')
    raise
