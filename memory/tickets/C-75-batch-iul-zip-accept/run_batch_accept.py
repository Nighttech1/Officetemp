# -*- coding: utf-8 -*-
"""C-75: batch IUL from templates/*.pdf → ZIP download → verify."""
from __future__ import annotations

import json
import re
import sys
import time
import zipfile
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(r"E:\Applications\OfficeTemp")
TEMPLATES = ROOT / "templates"
OUT = ROOT / "memory" / "tickets" / "C-75-batch-iul-zip-accept" / "artifacts"
URL = "http://127.0.0.1:3000/app/documents/info-sheet"


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    pdfs = sorted(TEMPLATES.glob("*.pdf"))
    if len(pdfs) < 2:
        print("NEED_PDFS", len(pdfs))
        return 2
    # Prefer smaller files first for speed, but include all
    pdfs_sorted = sorted(pdfs, key=lambda p: p.stat().st_size)
    print("PDFS", len(pdfs_sorted))
    for p in pdfs_sorted:
        print(f"  {p.stat().st_size}\t{p.name}")

    report: dict = {"pdfs": [p.name for p in pdfs_sorted], "ok": False}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(accept_downloads=True)
        page = context.new_page()
        page.set_viewport_size({"width": 1440, "height": 900})
        page.goto(URL, wait_until="domcontentloaded", timeout=120_000)

        # Auth gate
        for _ in range(60):
            body = page.locator("body").inner_text()
            if "Загрузка PDF" in body or "Информационно-удостоверяющий" in body:
                if "Подключаем кабинет" not in body and "Не удалось войти" not in body:
                    break
            if "Не удалось войти" in body:
                page.reload()
            time.sleep(1)
        else:
            page.screenshot(path=str(OUT / "auth-fail.png"))
            report["error"] = "auth timeout"
            (OUT / "report.json").write_text(
                json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            browser.close()
            return 3

        page.screenshot(path=str(OUT / "01-ready.png"))

        # Batch file input (sidebar multiple)
        file_input = page.locator('aside input[type="file"][multiple]')
        file_input.wait_for(state="attached", timeout=15_000)
        print("SET_FILES", len(pdfs_sorted))
        file_input.set_input_files([str(p) for p in pdfs_sorted])

        # Wait for batch create (analyze can be slow on large PDFs)
        deadline = time.time() + 600
        created = False
        while time.time() < deadline:
            body = page.locator("body").inner_text()
            if re.search(r"Создано ИУЛов:\s*\d+", body):
                m = re.search(r"Создано ИУЛов:\s*(\d+)", body)
                report["created_msg"] = m.group(0) if m else "found"
                created = True
                break
            if "Не удалось создать пакет" in body:
                report["error"] = "batch create failed"
                page.screenshot(path=str(OUT / "batch-fail.png"))
                break
            if "Создаём пакет ИУЛ" in body:
                pass
            time.sleep(2)
        page.screenshot(path=str(OUT / "02-after-batch.png"))
        if not created:
            report["error"] = report.get("error") or "batch timeout"
            (OUT / "report.json").write_text(
                json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            browser.close()
            return 4

        # Expect batch tabs + download button label
        body = page.locator("body").inner_text()
        report["has_batch_tabs"] = bool(
            re.search(r"Пакетный режим|вкладк", body, re.I)
        )
        # Go to step 4 then download, or click top button
        btn = page.get_by_role("button", name=re.compile(r"Скачать ИУЛы"))
        if btn.count() == 0:
            # try navigate to PDF step
            page.get_by_role("tab", name="PDF").click()
            time.sleep(0.5)
            btn = page.get_by_role("button", name=re.compile(r"Скачать ИУЛы"))
        if btn.count() == 0:
            report["error"] = "no Скачать ИУЛы button"
            page.screenshot(path=str(OUT / "no-download-btn.png"))
            (OUT / "report.json").write_text(
                json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            browser.close()
            return 5

        print("CLICK_DOWNLOAD")
        with page.expect_download(timeout=180_000) as dl_info:
            btn.first.click()
        download = dl_info.value
        zip_path = OUT / (download.suggested_filename or "IULy_batch.zip")
        download.save_as(str(zip_path))
        report["zip_name"] = zip_path.name
        report["zip_size"] = zip_path.stat().st_size
        print("ZIP", zip_path, report["zip_size"])

        page.screenshot(path=str(OUT / "03-after-download.png"))

        # Extract + verify
        extract_dir = OUT / "unzipped"
        if extract_dir.exists():
            for f in extract_dir.iterdir():
                f.unlink()
        else:
            extract_dir.mkdir(parents=True)

        with zipfile.ZipFile(zip_path, "r") as zf:
            names = zf.namelist()
            report["zip_entries"] = names
            zf.extractall(extract_dir)

        iul_files = list(extract_dir.glob("*.pdf"))
        report["iul_count"] = len(iul_files)
        report["expected"] = len(pdfs_sorted)

        details = []
        all_ok = True
        if len(iul_files) != len(pdfs_sorted):
            all_ok = False
        for f in iul_files:
            size = f.stat().st_size
            raw = f.read_bytes()
            # PDF header
            is_pdf = raw[:4] == b"%PDF"
            # jsPDF text often present
            has_iul_title = b"Informacionno" in raw or "удостоверительн".encode(
                "utf-8", errors="ignore"
            ) in raw or b"UL_" in raw or size > 1500
            # Check readable strings
            textish = raw.decode("latin-1", errors="ignore")
            has_object = "object" in textish.lower() or "бъект" in raw.decode(
                "cp1251", errors="ignore"
            )
            item = {
                "name": f.name,
                "size": size,
                "is_pdf": is_pdf,
                "non_empty": size > 1000,
            }
            details.append(item)
            if not (is_pdf and size > 1000):
                all_ok = False
            print(f"  IUL {f.name}: {size} pdf={is_pdf}")

        report["iul_details"] = details
        report["ok"] = all_ok and report["zip_size"] > 2000
        report["has_iul_title"] = has_iul_title
        report["has_object_hint"] = has_object

        (OUT / "report.json").write_text(
            json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        browser.close()
        print("REPORT_OK" if report["ok"] else "REPORT_FAIL", json.dumps(report, ensure_ascii=False))
        return 0 if report["ok"] else 6


if __name__ == "__main__":
    sys.exit(main())
