"""Regenerate committed Excel/CSV fixtures for data connector tests.

Run from backend/:

    python tests/fixtures/data/build_fixtures.py
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd
from openpyxl import Workbook

OUT_DIR = Path(__file__).resolve().parent


def build_sample_xlsx() -> Path:
    wb = Workbook()
    ws = wb.active
    ws.title = "Sheet1"
    ws.append(["Name", " Qty ", "ContractDate"])
    ws.append(["Alice", 2, "2026-01-15"])
    ws.append(["Bob", 5, "2026-02-01"])
    ws.append([None, None, None])  # trailing empty — parser should drop
    path = OUT_DIR / "sample.xlsx"
    wb.save(path)
    return path


def build_sample_csv() -> Path:
    # UTF-8 with BOM-compatible content; also used for cp1251 tests via code
    df = pd.DataFrame(
        [
            {"Name": "Alice", "Qty": 2, "City": "Moscow"},
            {"Name": "Bob", "Qty": 5, "City": "Kazan"},
        ]
    )
    path = OUT_DIR / "sample.csv"
    df.to_csv(path, index=False, encoding="utf-8")
    return path


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for p in (build_sample_xlsx(), build_sample_csv()):
        print(f"wrote {p}")


if __name__ == "__main__":
    main()
