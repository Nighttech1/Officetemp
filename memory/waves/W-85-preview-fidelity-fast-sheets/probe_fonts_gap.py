from pathlib import Path
from playwright.sync_api import sync_playwright

TPL = Path("nakladnaya1.docx").resolve()

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    page = b.new_page(viewport={"width": 1440, "height": 900})
    page.goto(
        "http://127.0.0.1:3000/app/documents/waybills",
        wait_until="domcontentloaded",
        timeout=90000,
    )
    page.wait_for_timeout(2000)
    page.get_by_role("button", name="Добавить накладную").click()
    page.wait_for_timeout(1500)
    page.locator('input[type="file"]').first.set_input_files(str(TPL))
    page.wait_for_timeout(4500)
    data = page.evaluate(
        """() => {
          const aside = document.querySelector('[aria-label=\"Предпросмотр накладной\"]');
          const root = aside.querySelector('.docx-waybill-preview');
          const section = root.querySelector('section');
          const header = root.querySelector('header');
          const img = header && header.querySelector('img');
          const spans = [...root.querySelectorAll('span')].filter(s => (s.textContent||'').trim().length>3).slice(0,8);
          const secCs = section ? getComputedStyle(section) : null;
          const headRect = header ? header.getBoundingClientRect() : null;
          const secRect = section ? section.getBoundingClientRect() : null;
          const imgRect = img ? img.getBoundingClientRect() : null;
          return {
            rootFont: root ? getComputedStyle(root).fontFamily : null,
            sectionClass: section && section.className,
            sectionPad: secCs && {t: secCs.paddingTop, l: secCs.paddingLeft, r: secCs.paddingRight},
            sectionMargin: secCs && secCs.marginTop,
            sectionStyle: section && (section.getAttribute('style')||'').slice(0,250),
            headerStyle: header && (header.getAttribute('style')||'').slice(0,200),
            gaps: {
              secTop: secRect && secRect.top,
              headTop: headRect && headRect.top,
              imgTop: imgRect && imgRect.top,
              imgToSec: (imgRect && secRect) ? (imgRect.top - secRect.top) : null,
            },
            fonts: spans.map(s => ({
              t: (s.textContent||'').trim().slice(0,35),
              f: getComputedStyle(s).fontFamily,
              inline: (s.getAttribute('style')||'').includes('font')
            })),
          };
        }"""
    )
    import json

    print(json.dumps(data, ensure_ascii=False, indent=2))
    b.close()
