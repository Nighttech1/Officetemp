"""Unit tests for Google Sheets connector (mocked httpx / request_fn)."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from app.services.connectors.errors import ConfigError
from app.services.connectors.google_sheets import fetch_sheet, load_google_credentials


def test_fetch_sheet_via_request_fn_values():
    def request_fn(url, method, headers):
        assert "spreadsheets" in url
        assert method == "GET"
        return {"values": [["Name", "Qty"], ["Alice", "2"], ["Bob", "5"]]}

    rows = fetch_sheet(
        "sheet123",
        "Sheet1!A1:B",
        credentials_info={"access_token": "unused"},
        request_fn=request_fn,
    )
    assert len(rows) == 2
    assert rows[0]["Name"] == "Alice"
    assert rows[1]["Qty"] == "5"


def test_fetch_sheet_via_request_fn_list():
    rows = fetch_sheet(
        "id",
        "A1",
        request_fn=lambda *_: [{"a": 1}],
    )
    assert rows == [{"a": 1}]


def test_fetch_sheet_httpx_client_mock():
    client = MagicMock()
    resp = MagicMock()
    resp.status_code = 200
    resp.json.return_value = {"values": [["Col"], ["v1"]]}
    client.get.return_value = resp

    rows = fetch_sheet(
        "abc",
        "Sheet1",
        credentials_info={"access_token": "tok"},
        http_client=client,
    )
    assert rows == [{"Col": "v1"}]
    client.get.assert_called_once()
    args, kwargs = client.get.call_args
    assert "abc" in args[0]
    assert kwargs["headers"]["Authorization"] == "Bearer tok"


def test_missing_credentials_raises_config_error(monkeypatch):
    from app.core.config import get_settings

    get_settings.cache_clear()
    monkeypatch.setenv("GOOGLE_SERVICE_ACCOUNT_JSON", "")
    get_settings.cache_clear()
    # Force empty settings field
    settings = get_settings()
    object.__setattr__(settings, "google_service_account_json", "")
    with pytest.raises(ConfigError, match="not configured"):
        load_google_credentials(None, settings=settings)
    get_settings.cache_clear()
