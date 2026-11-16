"""Unit tests for Yandex Sheets connector (mocked request_fn / httpx)."""

from __future__ import annotations

from pathlib import Path
from unittest.mock import MagicMock

import pytest

from app.services.connectors.errors import ConfigError
from app.services.connectors.yandex_sheets import fetch_sheet, resolve_yandex_token

FIXTURES = Path(__file__).resolve().parent / "fixtures" / "data"


def test_fetch_via_values_mock():
    def request_fn(url, method, headers):
        assert "spreadsheets" in url
        assert headers and "OAuth" in headers["Authorization"]
        return {"values": [["Name"], ["Zoe"]]}

    rows = fetch_sheet(
        "disk:/t.xlsx",
        "Sheet1",
        token="test-token",
        request_fn=request_fn,
    )
    assert rows == [{"Name": "Zoe"}]


def test_fetch_via_href_then_bytes():
    xlsx = (FIXTURES / "sample.xlsx").read_bytes()
    calls: list[str] = []

    def request_fn(url, method, headers):
        calls.append(url)
        if "href" not in url and "download" not in url.lower():
            # First call is values URL — return Disk-style href payload
            return {"href": "https://downloader.example/file"}
        return xlsx

    rows = fetch_sheet(
        "registry.xlsx",
        "Sheet1",
        token="tok",
        request_fn=request_fn,
        filename_hint="sample.xlsx",
    )
    assert len(rows) == 2
    assert rows[0]["Name"] == "Alice"


def test_httpx_disk_download_flow():
    xlsx = (FIXTURES / "sample.xlsx").read_bytes()
    client = MagicMock()
    meta = MagicMock()
    meta.status_code = 200
    meta.json.return_value = {"href": "https://downloader.example/x"}
    file_resp = MagicMock()
    file_resp.status_code = 200
    file_resp.content = xlsx
    client.get.side_effect = [meta, file_resp]

    rows = fetch_sheet(
        "tables/sample.xlsx",
        token="oauth-tok",
        http_client=client,
        filename_hint="sample.xlsx",
    )
    assert len(rows) == 2
    assert client.get.call_count == 2


def test_missing_token_raises(monkeypatch):
    from app.core.config import Settings

    settings = Settings(
        google_service_account_json="",
        yandex_sheets_token="",
        yandex_disk_token="",
    )
    with pytest.raises(ConfigError, match="not configured"):
        resolve_yandex_token(None, settings=settings)
