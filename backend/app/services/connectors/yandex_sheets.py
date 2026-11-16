"""Yandex Tables / Disk connector (httpx, mockable).

Expected HTTP flow (OAuth token from ``YANDEX_SHEETS_TOKEN`` or ``YANDEX_DISK_TOKEN``):

1. ``GET https://cloud-api.yandex.net/v1/disk/resources/download?path={path}``
   Header: ``Authorization: OAuth {token}``
   → JSON ``{"href": "https://..."}`` temporary download URL.

2. ``GET {href}`` → file bytes (``.xlsx`` / ``.csv``), then parse via excel_parser.

Optional Tables-style values mock (tests / future API):

   ``GET https://cloud-api.yandex.net/v1/disk/spreadsheets/{id}/values?range={range}``
   → ``{"values": [[header...], [row...]]}`` same shape as Google Sheets.

Injectable ``request_fn`` / ``http_client`` — no live Yandex calls in unit tests.
"""

from __future__ import annotations

from typing import Any, Callable, Mapping
from urllib.parse import quote

import httpx

from app.core.config import Settings, get_settings
from app.services.connectors.errors import ConfigError, ParseError, RowLimitExceeded
from app.services.connectors.excel_parser import parse_excel_or_csv

DISK_DOWNLOAD_URL = "https://cloud-api.yandex.net/v1/disk/resources/download"
# Documented placeholder for a values-style API (used when request_fn returns values JSON).
TABLES_VALUES_URL = (
    "https://cloud-api.yandex.net/v1/disk/spreadsheets/{spreadsheet_id}/values"
)

RequestFn = Callable[[str, str, Mapping[str, str] | None], Any]


def resolve_yandex_token(
    token: str | None = None,
    *,
    settings: Settings | None = None,
) -> str:
    if token and token.strip():
        return token.strip()
    settings = settings or get_settings()
    resolved = settings.effective_yandex_token
    if not resolved:
        raise ConfigError(
            "Yandex Tables is not configured: set YANDEX_SHEETS_TOKEN "
            "or YANDEX_DISK_TOKEN (OAuth token with disk read access)."
        )
    return resolved


def _values_to_rows(values: list[list[Any]], *, max_rows: int) -> list[dict[str, Any]]:
    if not values:
        return []
    headers_raw = values[0]
    headers: list[str] = []
    for i, h in enumerate(headers_raw):
        text = "" if h is None else str(h).strip()
        headers.append(text if text else f"column_{i}")
    body = values[1:]
    while body and all(not str(c).strip() for c in body[-1] if c is not None):
        body.pop()
    if len(body) > max_rows:
        raise RowLimitExceeded(
            f"Row count {len(body)} exceeds data_max_rows={max_rows}"
        )
    rows: list[dict[str, Any]] = []
    for line in body:
        padded = list(line) + [None] * max(0, len(headers) - len(line))
        row = {
            headers[i]: (
                str(padded[i]).strip()
                if padded[i] is not None and not isinstance(padded[i], (int, float, bool))
                else padded[i]
            )
            for i in range(len(headers))
        }
        rows.append(row)
    return rows


def _disk_path(spreadsheet_id: str) -> str:
    """Treat spreadsheet_id as a Disk path (absolute) or relative under disk:/."""
    sid = spreadsheet_id.strip()
    if sid.startswith("disk:") or sid.startswith("/"):
        return sid
    return f"disk:/{sid.lstrip('/')}"


def fetch_sheet(
    spreadsheet_id: str,
    range_: str = "Sheet1",
    *,
    token: str | None = None,
    max_rows: int | None = None,
    settings: Settings | None = None,
    http_client: httpx.Client | None = None,
    request_fn: RequestFn | None = None,
    filename_hint: str | None = None,
) -> list[dict[str, Any]]:
    """
    Fetch a Yandex table / Disk spreadsheet → list[dict].

    ``range_`` is kept for API symmetry with Google (sheet name / A1); when
    downloading a whole file via Disk it is stored in meta by the aggregator.
    """
    settings = settings or get_settings()
    limit = max_rows if max_rows is not None else settings.data_max_rows
    oauth = resolve_yandex_token(token, settings=settings)
    auth_headers = {"Authorization": f"OAuth {oauth}"}

    if request_fn is not None:
        values_url = TABLES_VALUES_URL.format(
            spreadsheet_id=quote(spreadsheet_id, safe="")
        )
        values_url = f"{values_url}?range={quote(range_, safe='!:')}"
        payload = request_fn(values_url, "GET", auth_headers)
        if isinstance(payload, list):
            if len(payload) > limit:
                raise RowLimitExceeded(
                    f"Row count {len(payload)} exceeds data_max_rows={limit}"
                )
            return payload
        if isinstance(payload, dict) and "values" in payload:
            return _values_to_rows(payload["values"], max_rows=limit)
        if isinstance(payload, (bytes, bytearray)):
            return parse_excel_or_csv(
                bytes(payload),
                filename=filename_hint or "sheet.xlsx",
                max_rows=limit,
            )
        if isinstance(payload, dict) and "href" in payload:
            # Second hop: download href via request_fn
            file_bytes = request_fn(str(payload["href"]), "GET", None)
            if not isinstance(file_bytes, (bytes, bytearray)):
                raise ParseError("Yandex download mock must return bytes")
            return parse_excel_or_csv(
                bytes(file_bytes),
                filename=filename_hint or "sheet.xlsx",
                max_rows=limit,
            )
        raise ParseError("Unexpected Yandex Sheets mock payload")

    owns_client = http_client is None
    client = http_client or httpx.Client(timeout=60.0)
    try:
        path = _disk_path(spreadsheet_id)
        meta = client.get(
            DISK_DOWNLOAD_URL,
            params={"path": path},
            headers=auth_headers,
        )
        if meta.status_code in (401, 403):
            raise ConfigError(
                f"Yandex Disk access denied ({meta.status_code})"
            )
        if meta.status_code == 404:
            raise ParseError(f"Yandex Disk path not found: {path}")
        if meta.status_code >= 400:
            raise ParseError(
                f"Yandex Disk API error ({meta.status_code}): {meta.text[:200]}"
            )
        href = meta.json().get("href")
        if not href:
            raise ParseError("Yandex Disk download response missing href")
        file_resp = client.get(href)
        if file_resp.status_code >= 400:
            raise ParseError(
                f"Yandex file download failed ({file_resp.status_code})"
            )
        hint = filename_hint or path.split("/")[-1] or "sheet.xlsx"
        return parse_excel_or_csv(
            file_resp.content, filename=hint, max_rows=limit
        )
    finally:
        if owns_client:
            client.close()
