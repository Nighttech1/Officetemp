from pathlib import Path
import json
from playwright.sync_api import sync_playwright

OUT = Path(r"e:\Applications\OfficeTemp\memory\waves\W-66-docs-contour-motion")
OUT.mkdir(parents=True, exist_ok=True)

def main():
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        page = b.new_page(viewport={"width": 1440, "height": 900})

        # Landing → footer links
        page.goto("http://127.0.0.1:3000/", wait_until="networkidle", timeout=90000)
        page.wait_for_timeout(500)
        footer = page.evaluate("""() => {
          const links = [...document.querySelectorAll('footer a')].map(a => ({href: a.getAttribute('href'), t: (a.textContent||'').trim()}));
          return {
            hasIul: links.some(l => l.href && l.href.includes('/info-sheet')),
            hasWaybill: links.some(l => l.href && l.href.includes('/waybills')),
            hasHome: links.some(l => l.href === '/' || (l.t||'').includes('Главная')),
          };
        }""")
        # Mega platform links
        page.locator('nav, header').first.hover()
        page.wait_for_timeout(200)
        # Services cards link
        page.locator("#use-cases").scroll_into_view_if_needed()
        page.wait_for_timeout(300)
        services = page.evaluate("""() => {
          const as = [...document.querySelectorAll('#use-cases a')].map(a => a.getAttribute('href'));
          return { count: as.length, hasIul: as.some(h => h && h.includes('info-sheet')), hasWb: as.some(h => h && h.includes('waybills')) };
        }""")
        page.screenshot(path=str(OUT / "after-landing-services.png"))

        # IUL page contour
        page.goto("http://127.0.0.1:3000/app/documents/info-sheet", wait_until="networkidle", timeout=90000)
        page.wait_for_timeout(1200)
        iul = page.evaluate("""() => {
          const nav = document.querySelector('nav[aria-label=\"Контур DocSaaS\"]');
          const home = nav ? [...nav.querySelectorAll('a')].some(a => a.getAttribute('href') === '/') : false;
          const switcher = nav ? [...nav.querySelectorAll('a')].map(a => a.getAttribute('href')) : [];
          const sideHome = !!document.querySelector('aside a[aria-label*=\"главную\"], aside a[href=\"/\"]');
          const logo = !!document.querySelector('a[href=\"/\"]');
          return { hasContour: !!nav, home, switcher, sideHome, logo };
        }""")
        page.screenshot(path=str(OUT / "after-iul.png"), full_page=False)

        # Click switcher to waybills
        page.locator('nav[aria-label="Контур DocSaaS"] a[href="/app/documents/waybills"]').click()
        page.wait_for_timeout(1500)
        way = page.evaluate("""() => {
          const nav = document.querySelector('nav[aria-label=\"Контур DocSaaS\"]');
          const cur = nav ? [...nav.querySelectorAll('[aria-current=page]')].map(e => (e.textContent||'').trim()) : [];
          const path = location.pathname;
          return { path, cur, hasContour: !!nav };
        }""")
        page.screenshot(path=str(OUT / "after-waybill.png"))

        # Back home via contour
        page.locator('nav[aria-label="Контур DocSaaS"] a[href="/"]').first.click()
        page.wait_for_timeout(1000)
        homePath = page.evaluate("() => location.pathname")

        report = {
            "footer": footer,
            "services": services,
            "iul": iul,
            "waybill": way,
            "backHome": homePath,
            "ok": (
                footer["hasIul"] and footer["hasWaybill"]
                and services["hasIul"] and services["hasWb"]
                and iul["hasContour"] and iul["home"]
                and way["path"].endswith("/waybills")
                and homePath == "/"
            ),
        }
        (OUT / "probe.json").write_text(json.dumps(report, ensure_ascii=True, indent=2), encoding="utf-8")
        print(json.dumps(report, ensure_ascii=True, indent=2))
        b.close()

if __name__ == "__main__":
    main()
