"""C-210 Playwright: wizard fields must not be clipped by overflow:hidden."""
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(r"e:\Applications\OfficeTemp\memory\waves\W-77-wizard-clip-fix")
OUT.mkdir(parents=True, exist_ok=True)
VIS = OUT / "visual"
VIS.mkdir(exist_ok=True)

URLS = [
    ("iul", "http://127.0.0.1:3000/app/documents/info-sheet"),
    ("waybill", "http://127.0.0.1:3000/app/documents/waybills"),
]


def check_page(page, name: str) -> dict:
    page.set_viewport_size({"width": 1440, "height": 900})
    page.goto(URLS[[u[0] for u in URLS].index(name)][1], wait_until="networkidle", timeout=60000)
    page.wait_for_timeout(1500)

    # Go to step with many fields if possible (IUL document step)
    if name == "iul":
        tab = page.get_by_role("tab", name="Документ")
        if tab.count():
            tab.first.click()
            page.wait_for_timeout(800)

    card = page.locator(".glass-card").first
    card.wait_for(state="visible", timeout=30000)
    box = card.bounding_box()
    assert box, "glass-card missing"

    # Collect inputs/textareas/buttons inside first glass card
    controls = card.locator("input, textarea, select, button, [role='textbox']")
    n = controls.count()
    clipped = []
    for i in range(n):
        el = controls.nth(i)
        if not el.is_visible():
            continue
        eb = el.bounding_box()
        if not eb:
            continue
        # Clipped if bottom of control is below card bottom AND card has overflow hidden
        # (with overflow auto, element can be scrolled into view)
        overflow_y = card.evaluate("el => getComputedStyle(el).overflowY")
        if eb["y"] + eb["height"] > box["y"] + box["height"] + 1:
            if overflow_y in ("hidden", "clip"):
                clipped.append(
                    {
                        "index": i,
                        "bottom": eb["y"] + eb["height"],
                        "cardBottom": box["y"] + box["height"],
                        "overflowY": overflow_y,
                    }
                )

    # Also: any control fully below viewport without ability to scroll document
    doc_scroll = page.evaluate("() => document.documentElement.scrollHeight > window.innerHeight + 2")
    page.screenshot(path=str(VIS / f"after-{name}-1440.png"), full_page=True)

    return {
        "name": name,
        "card": box,
        "overflowY": card.evaluate("el => getComputedStyle(el).overflowY"),
        "controls": n,
        "clippedHidden": clipped,
        "pageCanScroll": doc_scroll,
        "ok": len(clipped) == 0,
    }


def main():
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        for name, _ in URLS:
            results.append(check_page(page, name))
        browser.close()

    report = OUT / "playwright-clip-probe.json"
    import json

    report.write_text(json.dumps(results, indent=2), encoding="utf-8")
    failed = [r for r in results if not r["ok"]]
    print(json.dumps(results, indent=2))
    if failed:
        raise SystemExit(1)
    print("PASS C-210: no overflow:hidden clipping of controls")


if __name__ == "__main__":
    main()
