from pathlib import Path
import json
from playwright.sync_api import sync_playwright

OUT = Path("memory/waves/W-64-landing-polish")
OUT.mkdir(parents=True, exist_ok=True)

def main():
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        page = b.new_page(viewport={"width": 1440, "height": 900})
        page.goto("http://127.0.0.1:3000/?w64=1", wait_until="networkidle", timeout=90000)
        page.wait_for_timeout(800)

        css = page.evaluate("""() => {
          const sheet = [...document.styleSheets];
          let anim = null;
          for (const s of sheet) {
            try {
              for (const r of s.cssRules) {
                if (r.selectorText && r.selectorText.includes('landing-shimmer-cta') && r.style?.animation) {
                  anim = r.style.animation;
                }
                if (r.cssText && r.cssText.includes('landing-cta-shimmer 5.6s')) anim = '5.6s';
              }
            } catch {}
          }
          return {
            shimmerRule: anim,
            has56: [...document.styleSheets].some(s => { try { return [...s.cssRules].some(r => (r.cssText||'').includes('5.6s')); } catch { return false; } }),
          };
        }""")

        page.locator("#method").scroll_into_view_if_needed()
        page.wait_for_timeout(200)
        trio = page.evaluate("""() => {
          const s = document.querySelector('#method');
          const r = s.getBoundingClientRect();
          const pad = getComputedStyle(s.querySelector('.mx-auto')).paddingTop;
          return { h: Math.round(r.height), padTop: pad };
        }""")
        page.screenshot(path=str(OUT / "after-trio.png"))

        page.locator("#use-cases").scroll_into_view_if_needed()
        page.wait_for_timeout(400)
        usecases = page.evaluate("""() => {
          const arts = document.querySelectorAll('#use-cases article').length;
          const arrows = [...document.querySelectorAll('#use-cases button')].filter(b => ['←','→'].includes((b.textContent||'').trim())).length;
          return { cards: arts, arrows };
        }""")
        page.screenshot(path=str(OUT / "after-usecases.png"))

        page.locator("#capabilities").scroll_into_view_if_needed()
        page.wait_for_timeout(300)
        h1 = page.evaluate("""() => Math.round(document.querySelector('#capabilities').getBoundingClientRect().height)""")
        page.locator('#capabilities button[role=tab]').nth(2).hover()
        page.wait_for_timeout(400)
        h2 = page.evaluate("""() => Math.round(document.querySelector('#capabilities').getBoundingClientRect().height)""")
        active = page.evaluate("""() => {
          const tabs = [...document.querySelectorAll('#capabilities button[role=tab]')];
          const i = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
          return i;
        }""")
        page.screenshot(path=str(OUT / "after-capabilities.png"))

        page.locator("#faq").scroll_into_view_if_needed()
        page.wait_for_timeout(200)
        page.locator("#faq button[aria-expanded]").nth(1).click()
        page.wait_for_timeout(600)
        page.screenshot(path=str(OUT / "after-faq.png"))

        page.screenshot(path=str(OUT / "after-hero.png"), full_page=False)
        page.goto("http://127.0.0.1:3000/?w64=1", wait_until="networkidle")
        page.wait_for_timeout(400)
        page.screenshot(path=str(OUT / "after-hero.png"))

        b.close()
        report = {
            "css": css,
            "trio": trio,
            "usecases": usecases,
            "capabilities": {"hBefore": h1, "hAfterHover": h2, "stable": h1 == h2, "activeAfterHover": active},
        }
        (OUT / "probe.json").write_text(json.dumps(report, ensure_ascii=True, indent=2), encoding="utf-8")
        print(json.dumps(report, ensure_ascii=True, indent=2))

if __name__ == "__main__":
    main()
