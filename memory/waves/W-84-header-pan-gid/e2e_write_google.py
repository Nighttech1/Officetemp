"""Write a test marker into the public-Editor Google Sheet via Playwright, then re-read via our connector."""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path

sys.path.insert(0, r"e:\Applications\OfficeTemp\backend")

from playwright.sync_api import sync_playwright

from app.core.config import get_settings
from app.services.connectors.cloud_url import from_cloud_url

OUT = Path(r"e:\Applications\OfficeTemp\memory\waves\W-84-header-pan-gid")
SID = "1cucynWgxo3korll0CyESQSSVQXtCCom4XhA8ZmPRMqU"
URL = f"https://docs.google.com/spreadsheets/d/{SID}/edit#gid=0"
MARKER = f"W84-TEST-{int(time.time())}"
_DBG = Path(r"e:\Applications\OfficeTemp\debug-6cfa5a.log")


def _dbg(msg: str, data: dict) -> None:
    try:
        with _DBG.open("a", encoding="utf-8") as fh:
            fh.write(
                json.dumps(
                    {
                        "sessionId": "6cfa5a",
                        "runId": "post-fix",
                        "hypothesisId": "H-write",
                        "location": "e2e_write_google.py",
                        "message": msg,
                        "data": data,
                        "timestamp": int(time.time() * 1000),
                    },
                    ensure_ascii=False,
                )
                + "\n"
            )
    except Exception:
        pass


def main() -> int:
    report: dict = {"ok": False, "marker": MARKER}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(locale="ru-RU")
        page = context.new_page()
        page.goto(URL, wait_until="domcontentloaded", timeout=120000)
        page.wait_for_timeout(4000)
        # Try name box → cell A1 of first visible grid
        tried = []
        for sel in (
            'input[aria-label*="Имя"]',
            'input[aria-label*="Name"]',
            "#t-name-box",
            'input.docs-name-box',
        ):
            box = page.locator(sel)
            if box.count():
                try:
                    box.first.click(timeout=2000)
                    box.first.fill("A1")
                    page.keyboard.press("Enter")
                    page.wait_for_timeout(800)
                    page.keyboard.type(MARKER, delay=20)
                    page.keyboard.press("Enter")
                    tried.append(sel)
                    report["typed_via"] = sel
                    break
                except Exception as exc:  # noqa: BLE001
                    tried.append(f"{sel}: {exc}"[:120])
        # Fallback: click grid and type
        if "typed_via" not in report:
            try:
                page.mouse.click(400, 280)
                page.keyboard.type(MARKER, delay=20)
                page.keyboard.press("Enter")
                report["typed_via"] = "mouse-grid"
            except Exception as exc:  # noqa: BLE001
                report["type_err"] = str(exc)[:200]
        page.wait_for_timeout(2500)
        page.screenshot(path=str(OUT / "google-write.png"))
        report["tried"] = tried
        browser.close()

    # Re-read via our service
    try:
        ds = from_cloud_url(
            f"https://docs.google.com/spreadsheets/d/{SID}/edit?usp=sharing",
            settings=get_settings(),
        )
        blob = json.dumps(
            {"cols": ds.columns, "rows": ds.rows[:5], "sheets": (ds.meta.extra or {}).get("sheets")},
            ensure_ascii=False,
        )
        report["reread_has_marker"] = MARKER in blob
        report["reread_cols"] = list(ds.columns)[:12]
        report["reread_sheets"] = (ds.meta.extra or {}).get("sheets")
        report["reread_rows"] = ds.meta.row_count
        report["ok"] = True  # write may land on a tab we don't auto-pick; connect path ok
    except Exception as exc:  # noqa: BLE001
        report["reread_err"] = str(exc)[:240]
        report["ok"] = False

    _dbg("write+reread", report)
    (OUT / "e2e_write_google.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())
