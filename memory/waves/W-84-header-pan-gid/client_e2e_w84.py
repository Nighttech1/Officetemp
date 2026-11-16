"""Client Playwright: real Накладная1 header image + pan clamp + Google connect via UI."""
from __future__ import annotations

import json
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

OUT = Path(r"e:\Applications\OfficeTemp\memory\waves\W-84-header-pan-gid")
VIS = OUT / "visual"
VIS.mkdir(parents=True, exist_ok=True)
TPL = Path(r"e:\Applications\OfficeTemp\memory\waves\W-84-header-pan-gid\nakladnaya1.docx")
if not TPL.exists():
    TPL = next(Path(r"e:\Applications\OfficeTemp\templates").glob("*09.09.26.docx"))
GOOGLE = (
    "https://docs.google.com/spreadsheets/d/"
    "1cucynWgxo3korll0CyESQSSVQXtCCom4XhA8ZmPRMqU/edit?usp=sharing"
)
_DBG = Path(r"e:\Applications\OfficeTemp\debug-6cfa5a.log")


def _dbg(msg: str, data: dict) -> None:
    try:
        with _DBG.open("a", encoding="utf-8") as fh:
            fh.write(
                json.dumps(
                    {
                        "sessionId": "6cfa5a",
                        "runId": "post-fix",
                        "hypothesisId": "H-client",
                        "location": "client_e2e_w84.py",
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
    report: dict = {"ok": True, "checks": [], "template": str(TPL)}

    def check(name: str, passed: bool, detail=None) -> None:
        report["checks"].append({"name": name, "ok": passed, "detail": detail})
        if not passed:
            report["ok"] = False
        _dbg(name, {"ok": passed, "detail": detail})

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.goto(
            "http://127.0.0.1:3000/app/documents/waybills",
            wait_until="domcontentloaded",
            timeout=90000,
        )
        page.wait_for_timeout(2000)
        page.get_by_role("button", name="Добавить накладную").click()
        page.wait_for_timeout(1500)
        file_input = page.locator('input[type="file"]').first
        file_input.wait_for(state="attached", timeout=30000)
        file_input.set_input_files(str(TPL))
        page.wait_for_selector(".docx-preview-viewport", timeout=120000)
        # wait until header image decoded & fixed
        page.wait_for_function(
            """() => {
              const img = document.querySelector('[aria-label=\"Предпросмотр накладной\"] header img');
              return img && img.naturalWidth >= 100 && img.offsetWidth >= 50;
            }""",
            timeout=60000,
        )
        page.wait_for_timeout(500)

        meta = page.evaluate(
            """() => {
              const aside = document.querySelector('[aria-label=\"Предпросмотр накладной\"]');
              if (!aside) return { err: 'no aside' };
              const headers = [...aside.querySelectorAll('header')];
              const imgs = headers.flatMap(h => [...h.querySelectorAll('img')]);
              return {
                headerCount: headers.length,
                headerH: headers[0] ? headers[0].offsetHeight : 0,
                imgs: imgs.map(img => ({
                  nw: img.naturalWidth, nh: img.naturalHeight,
                  ow: img.offsetWidth, oh: img.offsetHeight,
                  parentW: img.parentElement ? img.parentElement.offsetWidth : 0,
                })),
              };
            }"""
        )
        img_ok = bool(
            meta.get("imgs")
            and meta["imgs"][0]["nw"] >= 100
            and meta["imgs"][0]["ow"] >= 50
            and meta["imgs"][0]["oh"] >= 40
        )
        check("C-821-real-header-image", img_ok, meta)
        page.screenshot(path=str(VIS / "preview-header.png"))

        # Pan: zoom in, enable pan, drag hard — pan.x/y must stay within document clamp
        for _ in range(8):
            btn = page.get_by_role("button", name="Приблизить")
            if btn.is_disabled():
                break
            btn.click()
        page.get_by_role("button", name="Режим перемещения").click()
        box = page.locator(".docx-preview-viewport").bounding_box()
        assert box
        page.mouse.move(box["x"] + box["width"] * 0.5, box["y"] + box["height"] * 0.4)
        page.mouse.down()
        page.mouse.move(box["x"] - 600, box["y"] - 600, steps=16)
        page.mouse.up()
        page.wait_for_timeout(200)
        pan_meta = page.evaluate(
            """() => {
              const stage = document.querySelector('.docx-preview-stage');
              const vp = document.querySelector('.docx-preview-viewport');
              const host = document.querySelector('.docx-waybill-preview');
              if (!stage || !vp || !host) return { err: 'missing' };
              const tr = stage.style.transform || '';
              const m = /translate\\((-?[\\d.]+)px,\\s*(-?[\\d.]+)px\\)/.exec(tr);
              const x = m ? parseFloat(m[1]) : 0;
              const y = m ? parseFloat(m[2]) : 0;
              const scaleM = /scale\\(([\\d.]+)\\)/.exec(tr);
              const scale = scaleM ? parseFloat(scaleM[1]) : 1;
              const docW = Math.max(stage.scrollWidth, stage.offsetWidth, host.scrollWidth) * scale;
              const docH = Math.max(stage.scrollHeight, stage.offsetHeight, host.scrollHeight) * scale;
              const vw = vp.clientWidth, vh = vp.clientHeight;
              const tol = 2;
              const xOk = x <= tol && (docW <= vw + tol ? Math.abs(x) <= tol : x >= vw - docW - tol);
              const yOk = y <= tol && (docH <= vh + tol ? Math.abs(y) <= tol : y >= vh - docH - tol);
              return { x, y, scale, docW, docH, vw, vh, xOk, yOk };
            }"""
        )
        check(
            "C-820-pan-document-only",
            bool(pan_meta.get("xOk") and pan_meta.get("yOk")),
            pan_meta,
        )
        page.screenshot(path=str(VIS / "preview-pan.png"))

        # Google connect through our UI
        page.get_by_role("tab", name="Данные").click()
        page.wait_for_timeout(600)
        cloud = page.get_by_role("button", name="Облачная таблица")
        if cloud.count():
            cloud.first.click()
            page.wait_for_timeout(400)
        inp = page.locator(
            'input[placeholder*="google"], input[placeholder*="spreadsheets"]'
        ).first
        inp.fill(GOOGLE)
        page.get_by_role("button", name="Подключить", exact=True).click()
        # wait up to 90s for connect
        deadline = time.time() + 90
        connect_ok = False
        last_body = ""
        while time.time() < deadline:
            page.wait_for_timeout(1500)
            last_body = page.locator("main").inner_text()
            if "gid=" in last_body and "HTTP" in last_body and "400" in last_body:
                break
            if "столб" in last_body.lower() or "колон" in last_body.lower() or "строк" in last_body.lower():
                connect_ok = True
                break
            # tree/objects appeared
            if page.locator("table").count() > 0 or "Реестр" in last_body or "объект" in last_body.lower():
                connect_ok = True
                break
            btn = page.get_by_role("button", name="подключаемся…")
            if btn.count() == 0 and "Подключить" in last_body:
                # finished; check error
                if "не отдал" in last_body or "HTTP" in last_body:
                    break
                connect_ok = "ошибк" not in last_body.lower()
                if connect_ok:
                    break
        page.screenshot(path=str(VIS / "step2-google.png"))
        check(
            "C-822-google-connect-ui",
            connect_ok,
            {"snippet": last_body[:400], "connect_ok": connect_ok},
        )

        browser.close()

    (OUT / "client_e2e_w84.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
