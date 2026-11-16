from pathlib import Path
import json
from playwright.sync_api import sync_playwright

OUT = Path(r"e:\Applications\OfficeTemp\memory\waves\W-69-landing-polish")
OUT.mkdir(parents=True, exist_ok=True)

def main():
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        page = b.new_page(viewport={"width": 1440, "height": 900})
        page.goto("http://127.0.0.1:3000/", wait_until="networkidle", timeout=90000)
        page.wait_for_timeout(800)

        page.locator("#services").scroll_into_view_if_needed()
        page.wait_for_timeout(400)
        services = page.evaluate("""() => {
          const sec = document.querySelector('#services');
          const ind = document.querySelector('#services [class*=origin-bottom], #services a');
          const img = document.querySelector('#services img');
          const fs = ind ? parseFloat(getComputedStyle(ind).fontSize) : 0;
          const ir = img?.getBoundingClientRect();
          const sr = sec?.getBoundingClientRect();
          return {
            bg: sec ? getComputedStyle(sec).backgroundColor : null,
            fontSize: Math.round(fs),
            imgW: ir ? Math.round(ir.width) : 0,
            imgH: ir ? Math.round(ir.height) : 0,
            imgRightish: ir && sr ? ir.left > (sr.left + sr.width * 0.4) : false,
            theme: sec?.getAttribute('data-landing-theme'),
          };
        }""")
        page.screenshot(path=str(OUT / "after-services.png"))

        page.locator(".landing-marquee").scroll_into_view_if_needed()
        page.wait_for_timeout(200)
        marquee = page.evaluate("""() => {
          const m = document.querySelector('.landing-marquee');
          const cs = getComputedStyle(m);
          return {
            borderTop: cs.borderTopWidth,
            borderBottom: cs.borderBottomWidth,
            bg: cs.backgroundColor,
            mb: Math.round(parseFloat(cs.marginBottom)),
            sectionBg: getComputedStyle(m.closest('section')).backgroundColor,
            sameBg: cs.backgroundColor === getComputedStyle(m.closest('section')).backgroundColor,
          };
        }""")
        page.screenshot(path=str(OUT / "after-marquee.png"))

        report = {"services": services, "marquee": marquee}
        (OUT / "probe.json").write_text(json.dumps(report, ensure_ascii=True, indent=2), encoding="utf-8")
        print(json.dumps(report, ensure_ascii=True, indent=2))
        b.close()

if __name__ == "__main__":
    main()
