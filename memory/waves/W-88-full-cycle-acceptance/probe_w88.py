"""W-88 live Playwright probe on localhost:3000."""
from __future__ import annotations

import json
import re
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "playwright-w88.json"
SHOT = ROOT / "after-desktop.png"
BASE = "http://127.0.0.1:3001"
TEMPLATES = Path(r"e:/Applications/OfficeTemp/templates")
TEMPLATE = next(
    (
        p
        for p in TEMPLATES.glob("*09.09.26.docx")
        if not p.name.startswith("~$")
    ),
    None,
)

result: dict = {"ok": False, "checks": {}, "errors": [], "ts": time.strftime("%Y-%m-%dT%H:%M:%S")}


def note(key: str, passed: bool, detail) -> None:
    result["checks"][key] = {"pass": passed, "detail": detail}


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.set_default_timeout(45000)
        try:
            page.goto(f"{BASE}/app/documents/waybills", wait_until="domcontentloaded", timeout=60000)
            page.wait_for_timeout(2500)

            body = page.inner_text("body")
            note("tree_or_demo", bool(re.search(r"Демо-проект|проект|Накладн", body, re.I)), body[:240])

            reg = page.get_by_role("tab", name=re.compile("реестр", re.I))
            note("registry_tab_present", reg.count() > 0, "tab")
            if reg.count() > 0:
                reg.first.click()
                page.wait_for_timeout(900)
                b2 = page.inner_text("body")
                note(
                    "registry_tab_opens",
                    bool(re.search(r"реестр результатов|ссылка на реестр|соответствие полей", b2, re.I)),
                    re.findall(r"Шаг\s*\d+[^\n]*", b2)[:3],
                )
                page.get_by_role("tab", name=re.compile("шаблон", re.I)).first.click()
                page.wait_for_timeout(500)

            if TEMPLATE and page.locator('input[type="file"][accept*="docx"]').count() > 0:
                page.locator('input[type="file"][accept*="docx"]').first.set_input_files(str(TEMPLATE))
                page.wait_for_timeout(5000)
                note(
                    "template_upload",
                    bool(re.search(r"шаблон.*сохран", page.inner_text("body"), re.I)),
                    TEMPLATE.name,
                )
            else:
                note("template_upload", False, "no input or template")

            metrics = page.evaluate(
                """() => {
  const vp = document.querySelector('.docx-preview-viewport');
  const host = document.querySelector('.docx-waybill-preview');
  const section = host?.querySelector('section');
  if (!vp || !host) return { missing: true };
  const style = getComputedStyle(vp);
  let maxRight = 0;
  const origin = host.getBoundingClientRect().left;
  host.querySelectorAll('*').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width > 1) maxRight = Math.max(maxRight, r.right - origin);
  });
  const tds = Array.from(host.querySelectorAll('td')).slice(0, 10).map(
    (td) => getComputedStyle(td).textAlign
  );
  return {
    overflowX: style.overflowX,
    scrollW: vp.scrollWidth,
    clientW: vp.clientWidth,
    hostW: host.scrollWidth,
    sectionW: section?.offsetWidth ?? 0,
    maxRight: Math.round(maxRight),
    tdAlign: tds,
    fillHint: /подставятся после выбора строк/i.test(document.body.innerText),
    stepLabel: (document.body.innerText.match(/шаг\\s*\\d+\\/\\d+/i) || [null])[0],
    hasHScrollbar: vp.scrollWidth > vp.clientWidth + 2,
  };
}"""
            )
            note(
                "preview_overflow_hidden",
                (not metrics.get("missing"))
                and metrics.get("overflowX") in ("hidden", "clip"),
                metrics,
            )
            note(
                "preview_no_native_hscroll",
                (not metrics.get("missing")) and not metrics.get("hasHScrollbar"),
                {
                    "scrollW": metrics.get("scrollW"),
                    "clientW": metrics.get("clientW"),
                },
            )
            if metrics.get("tdAlign"):
                centered = sum(1 for a in metrics["tdAlign"] if a == "center")
                note(
                    "cells_centered",
                    centered >= max(1, len(metrics["tdAlign"]) // 2),
                    {"centered": centered, "tdAlign": metrics["tdAlign"]},
                )

            page.get_by_role("tab", name=re.compile("данные", re.I)).first.click()
            page.wait_for_timeout(700)
            note(
                "sheet_multiselect_copy",
                bool(re.search(r"можно несколько|листы \(страницы\)", page.inner_text("body"), re.I)),
                "data step UI",
            )

            # API auth
            api = page.evaluate(
                """async () => {
  const login = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin1', password: 'admin1' }),
  });
  const lj = await login.json().catch(() => ({}));
  if (!lj.access_token) return { ok: false, status: login.status };
  const me = await fetch('/api/v1/auth/me', {
    headers: { Authorization: 'Bearer ' + lj.access_token },
  });
  return { ok: me.ok, status: me.status };
}"""
            )
            note("api_auth", bool(api.get("ok")), api)

            page.screenshot(path=str(SHOT))
            note("screenshot", True, str(SHOT))

            failed = [k for k, v in result["checks"].items() if not v["pass"]]
            result["ok"] = len(failed) == 0
            result["failedKeys"] = failed
        except Exception as exc:  # noqa: BLE001
            result["errors"].append(str(exc))
        finally:
            browser.close()
            OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
            print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
