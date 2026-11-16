"""W-82 Client Playwright: create waybill + template, verify preview toolbar & step2."""
from __future__ import annotations

import json
import io
from pathlib import Path

from docx import Document
from playwright.sync_api import sync_playwright

OUT = Path(r"e:\Applications\OfficeTemp\memory\waves\W-82-preview-sheets")
VIS = OUT / "visual"
VIS.mkdir(parents=True, exist_ok=True)
TMP = OUT / "_tmp_template.docx"


def _make_template() -> Path:
    doc = Document()
    section = doc.sections[0]
    section.header.paragraphs[0].text = "HEADER-W82-PROBE"
    section.footer.paragraphs[0].text = "FOOTER-W82-PROBE"
    doc.add_paragraph("Накладная {{NN}} от {{date}}")
    doc.add_paragraph("Получатель: {{name}}")
    doc.save(TMP)
    return TMP


def main() -> None:
    report: dict = {"ok": True, "checks": []}

    def check(name: str, passed: bool, detail=None) -> None:
        report["checks"].append({"name": name, "ok": passed, "detail": detail})
        if not passed:
            report["ok"] = False

    template = _make_template()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.goto(
            "http://127.0.0.1:3000/app/documents/waybills",
            wait_until="domcontentloaded",
            timeout=90000,
        )
        page.wait_for_timeout(1200)

        page.get_by_role("button", name="Добавить накладную").click()
        page.wait_for_timeout(1000)

        page.set_input_files('input[type="file"]', str(template))
        page.wait_for_timeout(3500)

        page.wait_for_selector(
            '[aria-label="Предпросмотр накладной"] .docx-preview-viewport',
            timeout=30000,
        )
        page.wait_for_timeout(1500)

        metrics = page.evaluate(
            """() => {
              const aside = document.querySelector('[aria-label="Предпросмотр накладной"]');
              const viewport = aside && aside.querySelector('.docx-preview-viewport');
              const toolbar = aside && aside.querySelector('.docx-preview-toolbar');
              const a4 = aside && aside.querySelector('.docx-a4-frame');
              const tCs = toolbar ? getComputedStyle(toolbar) : null;
              const body = aside ? (aside.innerText || '') : '';
              return {
                hasViewport: !!viewport,
                hasToolbar: !!toolbar,
                hasLegacyA4Frame: !!a4,
                toolbarPosition: tCs ? tCs.position : null,
                zoomLabel: toolbar && toolbar.querySelector('span')
                  ? toolbar.querySelector('span').textContent.trim()
                  : null,
                hasHeaderText: body.includes('HEADER-W82-PROBE'),
                hasFooterText: body.includes('FOOTER-W82-PROBE'),
                hostHtmlLen: aside ? aside.innerHTML.length : 0,
              };
            }"""
        )
        check(
            "C-820-toolbar-overlay",
            bool(
                metrics.get("hasToolbar")
                and metrics.get("toolbarPosition") == "absolute"
                and not metrics.get("hasLegacyA4Frame")
            ),
            metrics,
        )
        check(
            "C-821-headers-footers",
            bool(metrics.get("hasHeaderText") and metrics.get("hasFooterText")),
            metrics,
        )

        # zoom clamp UI: click zoom in many times — label must stay <= 150%
        for _ in range(12):
            page.get_by_role("button", name="Приблизить").click()
            page.wait_for_timeout(40)
        zoom_hi = page.evaluate(
            """() => {
              const t = document.querySelector('.docx-preview-toolbar span');
              return t ? t.textContent.trim() : null;
            }"""
        )
        check(
            "C-820-zoom-max-150",
            zoom_hi == "150%",
            {"zoom": zoom_hi},
        )
        for _ in range(20):
            page.get_by_role("button", name="Отдалить").click()
            page.wait_for_timeout(40)
        zoom_lo = page.evaluate(
            """() => {
              const t = document.querySelector('.docx-preview-toolbar span');
              return t ? t.textContent.trim() : null;
            }"""
        )
        check(
            "C-820-zoom-min-50",
            zoom_lo == "50%",
            {"zoom": zoom_lo},
        )

        page.get_by_role("tab", name="Данные").click()
        page.wait_for_timeout(600)
        cloud = page.get_by_role("button", name="Облачная таблица")
        if cloud.count():
            cloud.first.click()
            page.wait_for_timeout(400)
        connect = page.get_by_role("button", name="Подключить")
        check("C-822-connect-visible", connect.count() >= 1, {"count": connect.count()})

        # paste URL without blur-auto: fill and click away — contour should NOT appear yet
        url_input = page.locator('input[placeholder*="docs.google.com"]')
        if url_input.count():
            url_input.first.fill(
                "https://docs.google.com/spreadsheets/d/FAKE1234567890123456789012345678901234/edit"
            )
            page.get_by_role("heading", name="Шаг 2. Данные").click()
            page.wait_for_timeout(300)
            auto = page.evaluate(
                "() => !!document.querySelector('.cloud-connect-contour')"
            )
            check("C-822-no-blur-auto", auto is False, {"contour": auto})

        css_ok = page.evaluate(
            """() => {
              for (const s of document.styleSheets) {
                try {
                  for (const rule of s.cssRules || []) {
                    if (rule.cssText && rule.cssText.includes('cloud-connect-contour')) return true;
                  }
                } catch (e) {}
              }
              return false;
            }"""
        )
        check("C-822-contour-css", bool(css_ok), {"css_ok": css_ok})

        page.screenshot(path=str(VIS / "waybill-preview-after.png"))
        page.screenshot(path=str(VIS / "waybill-step2-cloud.png"))
        browser.close()

    (OUT / "playwright-w82.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(report, ensure_ascii=False, indent=2))
    raise SystemExit(0 if report["ok"] else 1)


if __name__ == "__main__":
    main()
