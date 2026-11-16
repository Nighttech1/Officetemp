from pathlib import Path
import json
from playwright.sync_api import sync_playwright

OUT = Path(r"e:\Applications\OfficeTemp\memory\waves\W-68-landing-polish")
OUT.mkdir(parents=True, exist_ok=True)

def main():
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        page = b.new_page(viewport={"width": 1440, "height": 900})
        page.goto("http://127.0.0.1:3000/", wait_until="networkidle", timeout=90000)
        page.wait_for_timeout(800)

        page.locator("#services").scroll_into_view_if_needed()
        page.wait_for_timeout(400)
        layout = page.evaluate("""() => {
          const list = document.querySelector('#services a');
          const img = document.querySelector('#services img');
          if (!list || !img) return null;
          const lr = list.getBoundingClientRect();
          const ir = img.getBoundingClientRect();
          // gap between list column and image (left edge of image - right of first link area)
          const labels = document.querySelector('#services .flex.flex-col, #services [class*=space-y]');
          const col = labels?.getBoundingClientRect();
          return {
            imgLeft: Math.round(ir.left),
            listRight: col ? Math.round(col.right) : Math.round(lr.right),
            gap: col ? Math.round(ir.left - col.right) : Math.round(ir.left - lr.right),
            imgNearCenterish: ir.left < 900,
          };
        }""")
        page.screenshot(path=str(OUT / "after-services.png"))

        page.locator(".landing-marquee").scroll_into_view_if_needed()
        page.wait_for_timeout(200)
        marquee = page.evaluate("""() => {
          const m = document.querySelector('.landing-marquee');
          const next = m?.parentElement?.nextElementSibling || m?.closest('section')?.nextElementSibling;
          const mr = m.getBoundingClientRect();
          const mb = parseFloat(getComputedStyle(m).marginBottom);
          const word = m.querySelector('span.inline-flex, .landing-marquee-track > span');
          return {
            marqueeH: Math.round(mr.height),
            marginBottom: Math.round(mb),
            ratio: mb / mr.height,
            hasHoverClass: word ? word.className.includes('hover:text-black') || word.className.includes('hover:font-bold') : false,
          };
        }""")
        page.screenshot(path=str(OUT / "after-marquee.png"))

        footer = page.evaluate("""() => {
          const a = document.querySelector('footer a.footer-link-underline');
          if (!a) return { hasClass: false };
          const after = getComputedStyle(a, '::after');
          return {
            hasClass: true,
            afterTransition: after.transitionProperty || after.transition,
            afterTransform: after.transform,
          };
        }""")

        # open solutions mega
        page.locator('header button:has-text("Решения")').hover()
        page.wait_for_timeout(400)
        nav = page.evaluate("""() => {
          const items = [...document.querySelectorAll('[role=menu] [role=menuitem], [role=menu] a')].map(a => (a.textContent||'').trim());
          const flat = items.join(' | ');
          return {
            items,
            hasCabinet: /Кабинет/i.test(flat) || /Шаблоны и генерация/i.test(flat),
          };
        }""")
        page.screenshot(path=str(OUT / "after-nav.png"))

        report = { "layout": layout, "marquee": marquee, "footer": footer, "nav": nav }
        (OUT / "probe.json").write_text(json.dumps(report, ensure_ascii=True, indent=2), encoding="utf-8")
        print(json.dumps(report, ensure_ascii=True, indent=2))
        b.close()

if __name__ == "__main__":
    main()
