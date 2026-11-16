"""W-83 Client: preview toolbar edge-cases + header image + connect UX copy."""
from __future__ import annotations

import io
import json
from pathlib import Path

from docx import Document
from docx.shared import Inches, Pt
from playwright.sync_api import sync_playwright

OUT = Path(r"e:\Applications\OfficeTemp\memory\waves\W-83-preview-connect-polish")
VIS = OUT / "visual"
VIS.mkdir(parents=True, exist_ok=True)
TMP = OUT / "_tmp_header_img.docx"


def _tiny_png() -> bytes:
    # 1x1 PNG
    import base64

    return base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    )


def _make_template() -> Path:
    doc = Document()
    section = doc.sections[0]
    header = section.header
    p = header.paragraphs[0]
    p.text = "HEADER-IMG-W83"
    run = p.add_run()
    bio = io.BytesIO(_tiny_png())
    run.add_picture(bio, width=Inches(0.4))
    section.footer.paragraphs[0].text = "FOOTER-W83"
    doc.add_paragraph("Тело {{NN}}")
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
        page.wait_for_timeout(1500)
        page.get_by_role("button", name="Добавить накладную").click()
        page.wait_for_timeout(1000)
        page.locator('input[type="file"]').first.set_input_files(str(template))
        page.wait_for_selector(".docx-preview-viewport", timeout=60000)
        page.wait_for_timeout(2000)

        # Header image in DOM
        img_meta = page.evaluate(
            """() => {
              const aside = document.querySelector('[aria-label="Предпросмотр накладной"]');
              const headers = [...aside.querySelectorAll('header, [class*="header"]')];
              const imgs = headers.flatMap(h => [...h.querySelectorAll('img')]);
              return {
                headerText: (aside.innerText||'').includes('HEADER-IMG-W83'),
                footerText: (aside.innerText||'').includes('FOOTER-W83'),
                headerImgCount: imgs.length,
                imgVisible: imgs.some(img => {
                  const cs = getComputedStyle(img);
                  return cs.display !== 'none' && cs.visibility !== 'hidden' && img.offsetWidth > 0;
                }),
              };
            }"""
        )
        check(
            "C-821-header-image",
            bool(img_meta.get("headerText") and img_meta.get("headerImgCount", 0) > 0 and img_meta.get("imgVisible")),
            img_meta,
        )

        # Toolbar outside pan: enable pan, drag hard, zoom must still work
        page.get_by_role("button", name="Режим перемещения").click()
        box = page.locator(".docx-preview-viewport").bounding_box()
        assert box
        page.mouse.move(box["x"] + box["width"] * 0.5, box["y"] + box["height"] * 0.4)
        page.mouse.down()
        page.mouse.move(box["x"] - 400, box["y"] - 400, steps=12)
        page.mouse.up()
        page.wait_for_timeout(200)

        # Toolbar still clickable
        zoom_before = page.locator(".docx-preview-toolbar span").inner_text()
        btn = page.get_by_role("button", name="Приблизить")
        check("C-820-zoom-enabled-after-pan", btn.is_enabled(), {"zoom_before": zoom_before})
        if btn.is_enabled():
            btn.click()
            page.wait_for_timeout(100)
        zoom_after = page.locator(".docx-preview-toolbar span").inner_text()
        check(
            "C-820-zoom-works-after-pan-void",
            zoom_after != zoom_before or not page.get_by_role("button", name="Приблизить").is_enabled(),
            {"zoom_before": zoom_before, "zoom_after": zoom_after},
        )

        # Fit resets
        page.get_by_role("button", name="Вписать в окно").click()
        page.wait_for_timeout(150)
        # Exit pan
        page.get_by_role("button", name="Режим перемещения").click()

        # Connect UX copy
        page.get_by_role("tab", name="Данные").click()
        page.wait_for_timeout(500)
        cloud = page.get_by_role("button", name="Облачная таблица")
        if cloud.count():
            cloud.first.click()
            page.wait_for_timeout(300)
        body = page.locator("main").inner_text()
        check(
            "C-822-expected-time-copy",
            "Ожидаемое время подключения" in body and "15–30" in body,
            {"has": "Ожидаемое время подключения" in body},
        )
        check(
            "C-822-no-status-plaque",
            "зелёный контур вокруг поля и кнопки — подождите" not in body,
        )

        page.screenshot(path=str(VIS / "preview-edge.png"))
        page.screenshot(path=str(VIS / "step2-copy.png"))
        browser.close()

    (OUT / "playwright-w83.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(report, ensure_ascii=False, indent=2))
    raise SystemExit(0 if report["ok"] else 1)


if __name__ == "__main__":
    main()
