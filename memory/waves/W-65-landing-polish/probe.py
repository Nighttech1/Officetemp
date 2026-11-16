from pathlib import Path
import json
from playwright.sync_api import sync_playwright

OUT = Path(r"e:\Applications\OfficeTemp\memory\waves\W-65-landing-polish")
OUT.mkdir(parents=True, exist_ok=True)

def main():
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        page = b.new_page(viewport={"width": 1440, "height": 900})
        page.goto("http://127.0.0.1:3000/?w65=1", wait_until="networkidle", timeout=90000)
        page.wait_for_timeout(700)

        # Services title
        page.locator("#use-cases").scroll_into_view_if_needed()
        page.wait_for_timeout(300)
        title = page.locator("#usecases-title").inner_text()
        gaps = page.evaluate("""() => {
          const arts = [...document.querySelectorAll('#use-cases article')];
          if (arts.length < 3) return {n: arts.length};
          const g = [];
          for (let i = 0; i < Math.min(5, arts.length-1); i++) {
            const a = arts[i].getBoundingClientRect();
            const b = arts[i+1].getBoundingClientRect();
            g.push(Math.round(b.left - a.right));
          }
          const track = document.querySelector('#use-cases [aria-label]');
          const pad = track ? getComputedStyle(track).paddingLeft : null;
          const lenis = !!document.querySelector('#use-cases [data-lenis-prevent]');
          return {n: arts.length, gaps: g, trackPadL: pad, lenisPrevent: lenis, titleOk: document.getElementById('usecases-title')?.textContent};
        }""")
        page.screenshot(path=str(OUT / "after-services.png"))

        # Wheel lock: hover + wheel should not change scrollY much
        beforeY = page.evaluate("() => window.scrollY")
        box = page.locator("#use-cases [data-lenis-prevent]").bounding_box()
        page.mouse.move(box["x"] + box["width"]/2, box["y"] + box["height"]/2)
        for _ in range(6):
            page.mouse.wheel(0, 120)
            page.wait_for_timeout(40)
        page.wait_for_timeout(200)
        afterY = page.evaluate("() => window.scrollY")
        transform = page.evaluate("""() => {
          const t = document.querySelector('#use-cases [aria-label]');
          return t ? t.style.transform : null;
        }""")

        # Integrations gaps
        page.locator("text=Работает с тем").scroll_into_view_if_needed()
        page.wait_for_timeout(200)
        integ = page.evaluate("""() => {
          const track = document.querySelector('.landing-marquee-track');
          if (!track) return null;
          const spans = [...track.children];
          const g = [];
          for (let i = 0; i < Math.min(4, spans.length-1); i++) {
            const a = spans[i].getBoundingClientRect();
            const b = spans[i+1].getBoundingClientRect();
            g.push(Math.round(b.left - a.right));
          }
          return {gaps: g, padL: getComputedStyle(track).paddingLeft, count: spans.length};
        }""")
        page.screenshot(path=str(OUT / "after-integrations.png"))

        # FAQ hover
        page.locator("#faq").scroll_into_view_if_needed()
        page.wait_for_timeout(200)
        li = page.locator("#faq li").nth(1)
        beforeH = page.evaluate("""() => Math.round(document.querySelectorAll('#faq li')[1].getBoundingClientRect().height)""")
        li.hover()
        page.wait_for_timeout(600)
        afterH = page.evaluate("""() => Math.round(document.querySelectorAll('#faq li')[1].getBoundingClientRect().height)""")
        expanded = page.evaluate("""() => document.querySelectorAll('#faq button')[1].getAttribute('aria-expanded')""")
        page.screenshot(path=str(OUT / "after-faq-hover.png"))
        # leave
        page.mouse.move(10, 10)
        page.wait_for_timeout(600)
        leftH = page.evaluate("""() => Math.round(document.querySelectorAll('#faq li')[1].getBoundingClientRect().height)""")
        leftExp = page.evaluate("""() => document.querySelectorAll('#faq button')[1].getAttribute('aria-expanded')""")

        # Login labels
        page.goto("http://127.0.0.1:3000/?w65=1", wait_until="networkidle")
        page.wait_for_timeout(400)
        page.locator('button:has-text("Личный кабинет")').first.hover()
        page.wait_for_timeout(400)
        login = page.evaluate("""() => {
          const dlg = document.querySelector('[role=dialog][aria-label*=\"Вход\"]');
          if (!dlg) return {open: false};
          const labels = [...dlg.querySelectorAll('label > span')].map(s => ({
            text: s.textContent.trim(),
            weight: getComputedStyle(s).fontWeight,
            color: getComputedStyle(s).color,
          }));
          const inputs = [...dlg.querySelectorAll('input')].map(i => ({
            weight: getComputedStyle(i).fontWeight,
            color: getComputedStyle(i).color,
          }));
          return {open: true, labels, inputs};
        }""")
        page.screenshot(path=str(OUT / "after-login.png"))

        report = {
            "title": title,
            "services": gaps,
            "scrollLock": {
                "beforeY": beforeY,
                "afterY": afterY,
                "deltaY": afterY - beforeY,
                "transform": transform,
                "locked": abs(afterY - beforeY) < 40,
            },
            "integrations": integ,
            "faq": {
                "beforeH": beforeH,
                "hoverH": afterH,
                "expanded": expanded,
                "leftH": leftH,
                "leftExpanded": leftExp,
                "hoverOpens": afterH > beforeH + 20,
                "leaveCloses": leftExp == "false" or leftH < afterH - 20,
            },
            "login": login,
        }
        (OUT / "probe.json").write_text(json.dumps(report, ensure_ascii=True, indent=2), encoding="utf-8")
        print(json.dumps(report, ensure_ascii=True, indent=2))
        b.close()

if __name__ == "__main__":
    main()
