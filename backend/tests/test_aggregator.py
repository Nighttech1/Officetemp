"""Unit tests for data aggregator Dataset contract."""

from __future__ import annotations

from pathlib import Path

from app.services.connectors.aggregator import aggregate, from_excel_bytes, from_google

FIXTURES = Path(__file__).resolve().parent / "fixtures" / "data"


def test_from_excel_bytes_dataset():
    ds = from_excel_bytes(
        (FIXTURES / "sample.xlsx").read_bytes(),
        filename="sample.xlsx",
    )
    assert ds.source == "excel"
    assert "Name" in ds.columns
    assert ds.meta.row_count == 2
    assert "T" in ds.meta.fetched_at or "+" in ds.meta.fetched_at


def test_from_csv_source_name():
    ds = from_excel_bytes(
        (FIXTURES / "sample.csv").read_bytes(),
        filename="sample.csv",
    )
    assert ds.source == "csv"


def test_from_google_via_request_fn():
    ds = from_google(
        "sid",
        "Sheet1!A:B",
        request_fn=lambda *_: {"values": [["A"], ["1"]]},
    )
    assert ds.source == "google"
    assert ds.rows == [{"A": "1"}]
    assert ds.meta.extra["spreadsheet_id"] == "sid"


def test_aggregate_dispatch():
    ds = aggregate(
        "excel",
        data=(FIXTURES / "sample.csv").read_bytes(),
        filename="sample.csv",
    )
    assert ds.source == "csv"
    ds2 = aggregate(
        "google",
        spreadsheet_id="x",
        range_="A1",
        request_fn=lambda *_: [{"k": "v"}],
    )
    assert ds2.source == "google"
    assert ds2.rows[0]["k"] == "v"
