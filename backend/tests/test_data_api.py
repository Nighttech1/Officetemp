"""API tests for /api/v1/data/* (JWT + offline mocks)."""

from __future__ import annotations

import base64
from pathlib import Path
from unittest.mock import patch

FIXTURES = Path(__file__).resolve().parent / "fixtures" / "data"
SAMPLE_XLSX = FIXTURES / "sample.xlsx"
SAMPLE_CSV = FIXTURES / "sample.csv"


def _auth_headers(client, register_payload):
    reg = client.post("/api/v1/auth/register", json=register_payload)
    assert reg.status_code == 201, reg.text
    token = reg.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_data_excel_xlsx(client, register_payload):
    headers = _auth_headers(client, register_payload)
    resp = client.post(
        "/api/v1/data/excel",
        headers=headers,
        files={
            "file": (
                "sample.xlsx",
                SAMPLE_XLSX.read_bytes(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
        },
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["source"] == "excel"
    assert body["meta"]["row_count"] == 2
    assert body["rows"][0]["Name"] == "Alice"


def test_data_excel_csv(client, register_payload):
    headers = _auth_headers(client, register_payload)
    resp = client.post(
        "/api/v1/data/excel",
        headers=headers,
        files={"file": ("sample.csv", SAMPLE_CSV.read_bytes(), "text/csv")},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["source"] == "csv"


def test_data_google_503_when_unconfigured(client, register_payload):
    headers = _auth_headers(client, register_payload)
    with patch(
        "app.api.routers.data.aggregator.from_google",
        side_effect=__import__(
            "app.services.connectors.errors", fromlist=["ConfigError"]
        ).ConfigError("Google Sheets is not configured"),
    ):
        resp = client.post(
            "/api/v1/data/google",
            headers=headers,
            json={"spreadsheet_id": "x", "range": "Sheet1!A1:B"},
        )
    assert resp.status_code == 503


def test_data_google_ok_mocked(client, register_payload):
    headers = _auth_headers(client, register_payload)
    fake = __import__(
        "app.services.connectors.aggregator", fromlist=["Dataset", "DatasetMeta"]
    )
    dataset = fake.Dataset(
        source="google",
        columns=["Name"],
        rows=[{"Name": "Ada"}],
        meta=fake.DatasetMeta(row_count=1, fetched_at="2026-09-22T00:00:00+00:00"),
    )
    with patch("app.api.routers.data.aggregator.from_google", return_value=dataset):
        resp = client.post(
            "/api/v1/data/google",
            headers=headers,
            json={"spreadsheet_id": "sid", "range": "Sheet1"},
        )
    assert resp.status_code == 200, resp.text
    assert resp.json()["rows"][0]["Name"] == "Ada"


def test_data_yandex_ok_mocked(client, register_payload):
    headers = _auth_headers(client, register_payload)
    fake = __import__(
        "app.services.connectors.aggregator", fromlist=["Dataset", "DatasetMeta"]
    )
    dataset = fake.Dataset(
        source="yandex",
        columns=["A"],
        rows=[{"A": "1"}],
        meta=fake.DatasetMeta(row_count=1, fetched_at="2026-09-22T00:00:00+00:00"),
    )
    with patch("app.api.routers.data.aggregator.from_yandex", return_value=dataset):
        resp = client.post(
            "/api/v1/data/yandex",
            headers=headers,
            json={"spreadsheet_id": "disk:/t.xlsx", "range": "Sheet1"},
        )
    assert resp.status_code == 200
    assert resp.json()["source"] == "yandex"


def test_data_aggregate_excel_base64(client, register_payload):
    headers = _auth_headers(client, register_payload)
    b64 = base64.b64encode(SAMPLE_CSV.read_bytes()).decode("ascii")
    resp = client.post(
        "/api/v1/data/aggregate",
        headers=headers,
        json={
            "source": "csv",
            "content_base64": b64,
            "filename": "sample.csv",
        },
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["meta"]["row_count"] == 2


def test_data_requires_auth(client):
    resp = client.post(
        "/api/v1/data/excel",
        files={"file": ("sample.csv", SAMPLE_CSV.read_bytes(), "text/csv")},
    )
    assert resp.status_code == 401
