"""Extra Playwright check: IUL document step + MultiButton fill width."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright

VIS = Path(r"e:\Applications\OfficeTemp\memory\waves\W-77-wizard-clip-fix\visual")
VIS.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto(
        "http://127.0.0.1:3000/app/documents/info-sheet",
        wait_until="networkidle",
        timeout=60000,
    )
    page.wait_for_timeout(1200)
    page.get_by_role("tab", name="Документ").first.click()
    page.wait_for_timeout(900)

    card = page.locator(".glass-card").first
    label = page.get_by_text("Наименование документа", exact=False).first
    label.wait_for(state="visible")
    label.scroll_into_view_if_needed()

    oy = card.evaluate("el => getComputedStyle(el).overflowY")
    lb = label.bounding_box()
    cb = card.bounding_box()
    clipped = False
    if lb and cb and oy in ("hidden", "clip"):
        if lb["y"] + lb["height"] > cb["y"] + cb["height"] + 1:
            clipped = True

    mb = page.locator('[data-slot="multi-button"]').first
    aside = page.locator("aside").first
    mbw = mb.bounding_box()
    asw = aside.bounding_box()
    ratio = (mbw["width"] / asw["width"]) if mbw and asw and asw["width"] else 0

    page.screenshot(path=str(VIS / "after-iul-document-step.png"), full_page=True)

    out = {
        "overflowY": oy,
        "clipped": clipped,
        "labelVisible": label.is_visible(),
        "multibuttonWidthRatio": round(ratio, 3),
        "ok": (not clipped) and oy != "hidden" and label.is_visible(),
    }
    Path(
        r"e:\Applications\OfficeTemp\memory\waves\W-77-wizard-clip-fix\playwright-doc-step.json"
    ).write_text(json.dumps(out, indent=2), encoding="utf-8")
    print(json.dumps(out, indent=2, ensure_ascii=False))
    browser.close()
    if not out["ok"]:
        raise SystemExit(1)
    print("DOC_STEP_PASS")
