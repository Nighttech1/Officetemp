"""W-78 Playwright acceptance: preview no v-scroll, chrome, signatures plaques, registry btn."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright

OUT = Path(r"e:\Applications\OfficeTemp\memory\waves\W-78-preview-chrome-registry")
VIS = OUT / "visual"
VIS.mkdir(parents=True, exist_ok=True)


def has_v_scrollbar(locator) -> bool:
    return locator.evaluate(
        "el => el.scrollHeight > el.clientHeight + 2"
    )


def main():
    results = {"ok": True, "checks": []}

    def check(name: str, passed: bool, detail=None):
        results["checks"].append({"name": name, "ok": passed, "detail": detail})
        if not passed:
            results["ok"] = False

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})

        # --- IUL ---
        page.goto(
            "http://127.0.0.1:3000/app/documents/info-sheet",
            wait_until="networkidle",
            timeout=90000,
        )
        page.wait_for_timeout(1200)

        # No breadcrumbs
        crumbs = page.get_by_text("Главная /", exact=False)
        check("no-breadcrumb-path", crumbs.count() == 0)

        # Title in contour
        check(
            "title-iul",
            page.get_by_role("heading", name="Информационно-удостоверяющий лист").count()
            >= 1,
        )

        # Steps present (Файл)
        check("steps-file-tab", page.get_by_role("tab", name="Файл").count() >= 1)

        preview = page.locator("[data-preview-shell='iul']").first
        if preview.count():
            try:
                metrics = preview.evaluate(
                    """el => {
                      const sheet = el.querySelector('.iul-sheet-preview');
                      const oy = sheet ? getComputedStyle(sheet).overflowY : null;
                      const overflowing = sheet
                        ? sheet.scrollHeight > sheet.clientHeight + 2
                        : false;
                      const shellOy = getComputedStyle(el).overflowY;
                      const shellOverflow =
                        el.scrollHeight > el.clientHeight + 2;
                      return {
                        overflowY: oy,
                        overflowing,
                        shellOy,
                        shellOverflow,
                        maxHeight: getComputedStyle(el).maxHeight,
                      };
                    }"""
                )
                check(
                    "preview-no-forced-yscroll",
                    not metrics.get("overflowing")
                    and not metrics.get("shellOverflow")
                    and metrics.get("maxHeight") in ("none", ""),
                    metrics,
                )
            except Exception as e:
                check("preview-no-forced-yscroll", False, str(e))
        else:
            check("preview-host-present", False)

        page.screenshot(path=str(VIS / "after-iul-chrome.png"), full_page=True)

        # Signatures step plaques — horizontal + left-aligned
        page.get_by_role("tab", name="Подписи").first.click()
        page.wait_for_timeout(900)
        add_btn = page.get_by_role("button", name="Добавить").first
        check("signatures-add-visible", add_btn.is_visible())
        tablist = page.locator('[role="tablist"]').filter(
            has=page.get_by_role("button", name="Добавить")
        )
        if tablist.count() == 0:
            tablist = page.locator('[role="tablist"]').last
        if tablist.count():
            metrics = tablist.first.evaluate(
                """el => {
                  const cs = getComputedStyle(el);
                  const r = el.getBoundingClientRect();
                  const parent = el.parentElement?.getBoundingClientRect();
                  return {
                    flexDirection: cs.flexDirection,
                    justifyContent: cs.justifyContent,
                    left: r.left,
                    parentLeft: parent ? parent.left : null,
                  };
                }"""
            )
            check(
                "plaques-horizontal",
                metrics.get("flexDirection") == "row",
                metrics,
            )
            jc = (metrics.get("justifyContent") or "").replace(" ", "")
            check(
                "plaques-left-aligned",
                jc in ("flex-start", "start", "left", "normal"),
                metrics,
            )
            if metrics.get("parentLeft") is not None:
                check(
                    "plaques-near-left-edge",
                    abs(metrics["left"] - metrics["parentLeft"]) < 24,
                    metrics,
                )
        else:
            check("plaques-present", False)

        page.screenshot(path=str(VIS / "after-iul-signatures.png"), full_page=True)

        # --- Waybills ---
        page.goto(
            "http://127.0.0.1:3000/app/documents/waybills",
            wait_until="networkidle",
            timeout=90000,
        )
        page.wait_for_timeout(1200)
        check(
            "title-waybill",
            page.get_by_role("heading", name="Накладные").count() >= 1,
        )
        check("no-breadcrumb-waybill", page.get_by_text("Главная /").count() == 0)
        check("steps-template", page.get_by_role("tab", name="Шаблон").count() >= 1)

        # Go to registry step if possible via tabs
        reg = page.get_by_role("tab", name="Реестр")
        if reg.count():
            reg.first.click()
            page.wait_for_timeout(800)
            primary = page.get_by_role("button", name="Записать данные в реестр")
            save = page.get_by_role("button", name="Сохранить настройки реестра")
            check("registry-primary", primary.count() >= 1 and primary.first.is_visible())
            check("registry-save-small", save.count() >= 1 and save.first.is_visible())
            # Далее should not be the label on step 5 for primary nav
            # (may still exist elsewhere)
            page.screenshot(path=str(VIS / "after-waybill-registry.png"), full_page=True)
        else:
            check("registry-tab", False)

        page.screenshot(path=str(VIS / "after-waybill-chrome.png"), full_page=True)
        browser.close()

    (OUT / "playwright-w78.json").write_text(
        json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(json.dumps(results, indent=2, ensure_ascii=False))
    if not results["ok"]:
        raise SystemExit(1)
    print("W78_PASS")


if __name__ == "__main__":
    main()
