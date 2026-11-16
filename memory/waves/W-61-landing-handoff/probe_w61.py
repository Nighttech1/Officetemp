"""W-61 visual guards via Playwright Python (MCP playwright still loading)."""
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path("memory/waves/W-61-landing-handoff")
OUT.mkdir(parents=True, exist_ok=True)
URL = "http://127.0.0.1:3000/?w61=1"

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Desktop 1440
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.goto(URL, wait_until="networkidle", timeout=60000)
        page.wait_for_timeout(800)
        page.screenshot(path=str(OUT / "after-hero-1440.png"), full_page=False)

        metrics = page.evaluate(
            """() => {
              const pillars = document.querySelectorAll('[aria-labelledby=pillars-title] li');
              const faq = document.querySelector('#faq');
              const faqItems = document.querySelectorAll('#faq button[aria-expanded]');
              const hero = document.querySelector('.landing-hero');
              const scene = document.querySelector('[data-assembly-root]');
              const h1 = document.querySelector('h1');
              return {
                pillarsCount: pillars.length,
                pillarHasBorder: pillars[0] ? getComputedStyle(pillars[0]).borderTopWidth : null,
                faqPresent: !!faq,
                faqButtons: faqItems.length,
                h1Font: h1 ? getComputedStyle(h1).fontSize : null,
                signatureW: scene ? Math.round(scene.getBoundingClientRect().width) : null,
                heroH: hero ? Math.round(hero.getBoundingClientRect().height) : null,
              };
            }"""
        )
        page.locator("#method").scroll_into_view_if_needed()
        page.wait_for_timeout(400)
        page.screenshot(path=str(OUT / "after-trio-1440.png"), full_page=False)
        page.locator("#faq").scroll_into_view_if_needed()
        page.wait_for_timeout(400)
        page.screenshot(path=str(OUT / "after-faq-1440.png"), full_page=False)
        # open second FAQ
        page.locator("#faq button[aria-expanded]").nth(1).click()
        page.wait_for_timeout(300)
        page.screenshot(path=str(OUT / "after-faq-open-1440.png"), full_page=False)

        # scroll pillars
        page.locator("[aria-labelledby=pillars-title]").scroll_into_view_if_needed()
        page.wait_for_timeout(400)
        page.screenshot(path=str(OUT / "after-pillars-1440.png"), full_page=False)

        # iPhone-ish
        iphone = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        iphone.goto(URL, wait_until="networkidle", timeout=60000)
        iphone.wait_for_timeout(800)
        iphone.screenshot(path=str(OUT / "after-hero-iphone.png"), full_page=False)
        mobile = iphone.evaluate(
            """() => {
              const hero = document.querySelector('.landing-hero');
              const scene = document.querySelector('[data-assembly-root]');
              const cta = document.querySelector('.landing-hero a[href=\"/register\"]');
              const hr = hero.getBoundingClientRect();
              const sr = scene.getBoundingClientRect();
              const cr = cta.getBoundingClientRect();
              return {
                heroH: Math.round(hr.height),
                sceneTop: Math.round(sr.top),
                sceneVisible: sr.top < window.innerHeight && sr.bottom > 0,
                gapCtaToScene: Math.round(sr.top - cr.bottom),
                sceneW: Math.round(sr.width),
                vh: window.innerHeight,
              };
            }"""
        )

        # Android-ish
        android = browser.new_page(viewport={"width": 412, "height": 915}, device_scale_factor=2.625, is_mobile=True, has_touch=True)
        android.goto(URL, wait_until="networkidle", timeout=60000)
        android.wait_for_timeout(800)
        android.screenshot(path=str(OUT / "after-hero-android.png"), full_page=False)

        browser.close()
        report = {"desktop": metrics, "iphone": mobile}
        (OUT / "probe.json").write_text(__import__("json").dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        print(__import__("json").dumps(report, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
