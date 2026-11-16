"""Probe preview: header absolute (no flow height), fonts, pan no-select."""
from __future__ import annotations

import json
import shutil
import zipfile
from pathlib import Path

from playwright.sync_api import sync_playwright

OUT = Path(r"e:\Applications\OfficeTemp\memory\waves\W-85-preview-fidelity-fast-sheets")
VIS = OUT / "visual"
VIS.mkdir(parents=True, exist_ok=True)
SRC = next(
    p
    for p in Path(r"e:\Applications\OfficeTemp\templates").glob("*09.09.26.docx")
    if not p.name.startswith("~$") and zipfile.is_zipfile(p)
)
TPL = OUT / "nakladnaya1.docx"
shutil.copy2(SRC, TPL)


def main() -> int:
    report: dict = {"ok": True, "checks": [], "tpl_bytes": TPL.stat().st_size}

    def check(name: str, passed: bool, detail=None) -> None:
        report["checks"].append({"name": name, "ok": passed, "detail": detail})
        if not passed:
            report["ok"] = False

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.goto(
            "http://127.0.0.1:3000/app/documents/waybills",
            wait_until="domcontentloaded",
            timeout=90000,
        )
        page.wait_for_timeout(2500)
        page.get_by_role("button", name="Добавить накладную").click()
        page.wait_for_timeout(1500)
        page.locator('input[type="file"]').first.set_input_files(str(TPL))

        # Poll like debug harness (visible can race with layout)
        vp_ok = False
        for _ in range(40):
            page.wait_for_timeout(500)
            if page.locator(".docx-preview-viewport").count() > 0:
                vp_ok = True
                break
        check("viewport-present", vp_ok)
        if not vp_ok:
            report["body"] = page.locator("main").inner_text()[:600]
            (OUT / "probe_preview_fidelity.json").write_text(
                json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            print(json.dumps(report, ensure_ascii=False, indent=2))
            browser.close()
            return 1

        # wait header image metrics
        for _ in range(40):
            page.wait_for_timeout(250)
            ready = page.evaluate(
                """() => {
                  const img = document.querySelector('[aria-label=\"Предпросмотр накладной\"] header img');
                  return !!(img && img.naturalWidth >= 100);
                }"""
            )
            if ready:
                break

        meta = page.evaluate(
            """() => {
              const aside = document.querySelector('[aria-label=\"Предпросмотр накладной\"]');
              const header = aside.querySelector('header');
              const img = header && header.querySelector('img');
              const wrap = img && img.parentElement;
              const csH = header ? getComputedStyle(header) : null;
              const csI = img ? getComputedStyle(img) : null;
              const section = aside.querySelector('section.docx');
              const p = aside.querySelector('section.docx p');
              return {
                headerH: header ? header.offsetHeight : 0,
                headerMarginTop: csH && csH.marginTop,
                headerMinHeight: csH && csH.minHeight,
                imgPos: csI && csI.position,
                imgWH: img ? [img.offsetWidth, img.offsetHeight] : null,
                natural: img ? [img.naturalWidth, img.naturalHeight] : null,
                wrapWH: wrap ? [wrap.offsetWidth, wrap.offsetHeight] : null,
                wrapStyle: wrap ? (wrap.getAttribute('style')||'').slice(0,200) : null,
                sectionFont: section ? getComputedStyle(section).fontFamily : '',
                pFont: p ? getComputedStyle(p).fontFamily : '',
                viewportOverflow: getComputedStyle(aside.querySelector('.docx-preview-viewport')).overflow,
              };
            }"""
        )
        floating_ok = (
            meta.get("imgPos") == "absolute"
            and meta.get("wrapWH")
            and meta["wrapWH"][0] <= 2
            and meta["wrapWH"][1] <= 2
            and meta.get("imgWH")
            and meta["imgWH"][0] >= 50
            and meta.get("natural")
            and meta["natural"][0] >= 100
        )
        check("C-851-floating-header-absolute", floating_ok, meta)
        fonts = page.evaluate(
            """() => {
              const root = document.querySelector('.docx-waybill-preview');
              if (!root) return { root: null, samples: [] };
              const spans = [...root.querySelectorAll('span')]
                .filter((s) => (s.textContent || '').trim().length > 3)
                .slice(0, 6);
              return {
                root: getComputedStyle(root).fontFamily,
                samples: spans.map((s) => getComputedStyle(s).fontFamily),
              };
            }"""
        )
        sample = " ".join(fonts.get("samples") or [])
        font_ok = bool(
            sample
            and (
                "Calibri" in sample
                or "Times" in sample
                or "times" in sample.lower()
                or "serif" in sample.lower()
            )
        )
        check("C-851-doc-fonts", font_ok, fonts)
        page.screenshot(path=str(VIS / "preview-fidelity.png"))

        page.get_by_role("button", name="Режим перемещения").click()
        page.wait_for_timeout(150)
        pan_cls = page.evaluate(
            """() => document.querySelector('.docx-preview-viewport')?.className || ''"""
        )
        check("C-852-pan-class", "docx-preview-viewport--pan" in pan_cls, {"cls": pan_cls})
        box = page.locator(".docx-preview-viewport").bounding_box()
        assert box
        page.mouse.move(box["x"] + 80, box["y"] + 80)
        page.mouse.down()
        page.mouse.move(box["x"] + 220, box["y"] + 180, steps=10)
        sel = page.evaluate("() => (window.getSelection()?.toString() || '').length")
        page.mouse.up()
        check("C-852-no-text-select-on-pan", sel == 0, {"selLen": sel})
        page.screenshot(path=str(VIS / "preview-pan.png"))

        browser.close()

    (OUT / "probe_preview_fidelity.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
