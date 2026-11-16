"""Final landing handoff probe W-62…W-64."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright

OUT = Path("memory/waves/W-62-landing-finish")
OUT.mkdir(parents=True, exist_ok=True)
URL = "http://127.0.0.1:3000/?finish=1"

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.goto(URL, wait_until="networkidle", timeout=90000)
        page.wait_for_timeout(1000)
        page.screenshot(path=str(OUT / "after-hero-1440.png"))

        data = page.evaluate(
            """() => {
              const brandBtn = document.querySelector('.bg-brand, a.landing-shimmer-cta, [class*=\"bg-brand\"]');
              const cs = brandBtn ? getComputedStyle(brandBtn) : null;
              const root = getComputedStyle(document.documentElement);
              const fav = [...document.querySelectorAll('link[rel*=\"icon\"]')].map(l => l.href);
              const dots = [...document.querySelectorAll('nav button span, [aria-label=\"Разделы сервиса\"] button')];
              const megaBtns = [...document.querySelectorAll('[aria-label=\"Разделы сервиса\"] > div > button, [aria-label=\"Разделы сервиса\"] button')];
              const hasOldDot = megaBtns.some(b => {
                const s = b.querySelector('span.h-1\\\\.5, span[class*=\"h-1.5\"]');
                return !!s;
              });
              const chevrons = megaBtns.filter(b => (b.textContent||'').includes('▾')).length;
              const faq = !!document.querySelector('#faq');
              const intro = document.querySelector('[aria-labelledby=intro-product-title]');
              const introBg = intro ? getComputedStyle(intro).backgroundColor : null;
              const h1 = document.querySelector('h1');
              const scene = document.querySelector('[data-assembly-root]');
              const hero = document.querySelector('.landing-hero');
              const nBadge = document.querySelector('#__next-build-watcher, [data-nextjs-dev-tools-button], button[aria-label*=\"Next.js Dev\"]');
              return {
                cssBrand: root.getPropertyValue('--color-brand').trim(),
                btnBg: cs ? cs.backgroundColor : null,
                favicons: fav,
                hasOldNavDots: hasOldDot,
                chevronCount: chevrons,
                faq,
                introBg,
                h1Font: h1 ? getComputedStyle(h1).fontSize : null,
                signaturePct: scene && hero ? +(scene.getBoundingClientRect().width / hero.getBoundingClientRect().width * 100).toFixed(1) : null,
                nextDevBadge: !!nBadge,
              };
            }"""
        )

        # favicon request
        favStatus = page.request.get("http://127.0.0.1:3000/icon").status
        # also try apple-icon
        try:
            appleStatus = page.request.get("http://127.0.0.1:3000/apple-icon").status
        except Exception:
            appleStatus = None

        page.locator("[aria-labelledby=pillars-title]").scroll_into_view_if_needed()
        page.wait_for_timeout(300)
        page.screenshot(path=str(OUT / "after-pillars-1440.png"))
        page.locator("[aria-labelledby=intro-product-title]").scroll_into_view_if_needed()
        page.wait_for_timeout(300)
        page.screenshot(path=str(OUT / "after-intro-1440.png"))
        page.locator("#faq").scroll_into_view_if_needed()
        page.wait_for_timeout(300)
        page.screenshot(path=str(OUT / "after-faq-1440.png"))

        iphone = browser.new_page(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
        iphone.goto(URL, wait_until="networkidle", timeout=90000)
        iphone.wait_for_timeout(800)
        iphone.screenshot(path=str(OUT / "after-hero-iphone.png"))
        mobile = iphone.evaluate(
            """() => {
              const scene = document.querySelector('[data-assembly-root]');
              const cta = document.querySelector('.landing-hero a[href=\"/register\"]');
              return {
                gap: Math.round(scene.getBoundingClientRect().top - cta.getBoundingClientRect().bottom),
                sceneVisible: scene.getBoundingClientRect().top < window.innerHeight,
                brand: getComputedStyle(document.documentElement).getPropertyValue('--color-brand').trim(),
              };
            }"""
        )

        android = browser.new_page(viewport={"width": 412, "height": 915}, is_mobile=True, has_touch=True)
        android.goto(URL, wait_until="networkidle", timeout=90000)
        android.wait_for_timeout(600)
        android.screenshot(path=str(OUT / "after-hero-android.png"))

        browser.close()
        report = {
            "desktop": data,
            "faviconIcon": favStatus,
            "appleIcon": appleStatus,
            "iphone": mobile,
        }
        (OUT / "probe.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        print(json.dumps(report, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
