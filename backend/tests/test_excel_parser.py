"""Unit tests for excel_parser."""

from __future__ import annotations

from pathlib import Path

import pytest

from app.services.connectors.errors import RowLimitExceeded
from app.services.connectors.excel_parser import (
    parse_csv_bytes,
    parse_excel_or_csv,
    parse_xlsx_bytes,
)

FIXTURES = Path(__file__).resolve().parent / "fixtures" / "data"
SAMPLE_XLSX = FIXTURES / "sample.xlsx"
SAMPLE_CSV = FIXTURES / "sample.csv"


def test_parse_xlsx_fixture():
    assert SAMPLE_XLSX.is_file()
    rows = parse_xlsx_bytes(SAMPLE_XLSX.read_bytes(), max_rows=5000)
    assert len(rows) == 2
    assert "Name" in rows[0]
    assert rows[0]["Name"] == "Alice"
    # Header strip: " Qty " → "Qty"
    assert "Qty" in rows[0]
    assert rows[0]["Qty"] == 2


def test_parse_csv_utf8_fixture():
    assert SAMPLE_CSV.is_file()
    rows = parse_csv_bytes(SAMPLE_CSV.read_bytes())
    assert len(rows) == 2
    assert rows[1]["City"] == "Kazan"


def test_parse_csv_cp1251():
    text = "Name;Qty\nИван;3\n"
    data = text.encode("cp1251")
    rows = parse_csv_bytes(data)
    assert len(rows) == 1
    assert rows[0]["Name"] == "Иван"
    assert rows[0]["Qty"] == "3"


def test_drop_trailing_empty_csv():
    data = b"A,B\n1,2\n,\n,\n"
    rows = parse_csv_bytes(data)
    assert len(rows) == 1


def test_max_rows_enforced():
    header = "A,B\n"
    body = "".join(f"{i},x\n" for i in range(10))
    with pytest.raises(RowLimitExceeded):
        parse_csv_bytes((header + body).encode("utf-8"), max_rows=5)


def test_parse_excel_or_csv_by_filename():
    rows = parse_excel_or_csv(SAMPLE_CSV.read_bytes(), filename="sample.csv")
    assert rows[0]["Name"] == "Alice"
    rows_x = parse_excel_or_csv(SAMPLE_XLSX.read_bytes(), filename="sample.xlsx")
    assert rows_x[0]["Name"] == "Alice"
