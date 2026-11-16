from pathlib import Path
from playwright.sync_api import sync_playwright

TPL = Path(
    r"e:/Applications/OfficeTemp/memory/waves/W-85-preview-fidelity-fast-sheets/nakladnaya1.docx"
)
OUT = Path(
    r"e:/Applications/OfficeTemp/memory/waves/W-85-preview-fidelity-fast-sheets/visual"
)

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    page = b.new_page(viewport={"width": 1440, "height": 900})
    page.goto(
        "http://127.0.0.1:3000/app/documents/waybills",
        wait_until="domcontentloaded",
        timeout=90000,
    )
    page.wait_for_timeout(3000)
    page.get_by_role("button", name="Добавить накладную").click()
    page.wait_for_timeout(2000)
    print("files", page.locator('input[type="file"]').count())
    page.locator('input[type="file"]').first.set_input_files(str(TPL))
    for i in range(15):
        page.wait_for_timeout(800)
        print(
            i,
            "aside",
            page.locator('[aria-label="Предпросмотр накладной"]').count(),
            "vp",
            page.locator(".docx-preview-viewport").count(),
            "img",
            page.locator("header img").count(),
        )
        if page.locator(".docx-preview-viewport").count():
            break
    page.screenshot(path=str(OUT / "debug3.png"))
    print(page.locator("main").inner_text()[:1000])
    b.close()
