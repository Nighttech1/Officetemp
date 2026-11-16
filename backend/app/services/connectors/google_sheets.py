"""Google Sheets API v4 connector (httpx, mockable; no hard dep on google-auth).

Auth:
  - ``credentials_info`` dict with ``access_token``, OR
  - service-account JSON (``type``: service_account) — exchanges JWT for token, OR
  - settings ``GOOGLE_SERVICE_ACCOUNT_JSON`` (file path or inline JSON).

152-ФЗ: storing Russian personal data in Google Sheets is a compliance risk;
prefer Yandex Tables / local Excel for RF PII.

Injectable ``request_fn`` / ``http_client`` for offline tests.
"""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any, Callable, Mapping
from urllib.parse import quote

import httpx

from app.core.config import Settings, get_settings
from app.services.connectors.errors import ConfigError, ParseError, RowLimitExceeded

SHEETS_VALUES_URL = (
    "https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/{range_}"
)
TOKEN_URL = "https://oauth2.googleapis.com/token"
READONLY_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly"

RequestFn = Callable[[str, str, Mapping[str, str] | None], Any]


def load_google_credentials(
    credentials_info: Mapping[str, Any] | None = None,
    *,
    settings: Settings | None = None,
) -> dict[str, Any]:
    """Resolve credentials from arg or GOOGLE_SERVICE_ACCOUNT_JSON setting."""
    if credentials_info is not None:
        return dict(credentials_info)

    settings = settings or get_settings()
    raw = (settings.google_service_account_json or "").strip()
    if not raw:
        raise ConfigError(
            "Google Sheets is not configured: set GOOGLE_SERVICE_ACCOUNT_JSON "
            "(path to service-account JSON or inline JSON), or pass credentials_info."
        )
    if raw.startswith("{"):
        try:
            return json.loads(raw)
        except json.JSONDecodeError as exc:
            raise ConfigError(
                "GOOGLE_SERVICE_ACCOUNT_JSON looks like JSON but is invalid"
            ) from exc
    path = Path(raw)
    if not path.is_file():
        raise ConfigError(
            f"GOOGLE_SERVICE_ACCOUNT_JSON path not found: {path}"
        )
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ConfigError(f"Failed to load Google credentials: {exc}") from exc


def _service_account_access_token(
    creds: Mapping[str, Any],
    *,
    http_client: httpx.Client | None = None,
) -> str:
    """Mint a short-lived access token via JWT grant (stdlib + cryptography via jose)."""
    from jose import jwt

    client_email = creds.get("client_email")
    private_key = creds.get("private_key")
    token_uri = creds.get("token_uri") or TOKEN_URL
    if not client_email or not private_key:
        raise ConfigError(
            "Google service account JSON must include client_email and private_key "
            "(or pass credentials_info with access_token)."
        )
    now = int(time.time())
    assertion = jwt.encode(
        {
            "iss": client_email,
            "scope": READONLY_SCOPE,
            "aud": token_uri,
            "iat": now,
            "exp": now + 3600,
        },
        private_key,
        algorithm="RS256",
    )
    owns_client = http_client is None
    client = http_client or httpx.Client(timeout=30.0)
    try:
        resp = client.post(
            token_uri,
            data={
                "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
                "assertion": assertion,
            },
        )
        if resp.status_code >= 400:
            raise ConfigError(
                f"Google token exchange failed ({resp.status_code}): "
                f"{resp.text[:200]}"
            )
        token = resp.json().get("access_token")
        if not token:
            raise ConfigError("Google token response missing access_token")
        return str(token)
    finally:
        if owns_client:
            client.close()


def resolve_access_token(
    creds: Mapping[str, Any],
    *,
    http_client: httpx.Client | None = None,
) -> str:
    if creds.get("access_token"):
        return str(creds["access_token"])
    return _service_account_access_token(creds, http_client=http_client)


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


def fetch_sheet(
    spreadsheet_id: str,
    range_: str,
    *,
    credentials_info: Mapping[str, Any] | None = None,
    max_rows: int | None = None,
    settings: Settings | None = None,
    http_client: httpx.Client | None = None,
    request_fn: RequestFn | None = None,
) -> list[dict[str, Any]]:
    """
    Fetch a range from Google Sheets → list[dict].

    ``request_fn(url, method, headers)`` may return either a Sheets API JSON
    body (``{"values": [...]}``) or a list of row dicts (already normalized).
    """
    settings = settings or get_settings()
    limit = max_rows if max_rows is not None else settings.data_max_rows

    if request_fn is not None:
        url = SHEETS_VALUES_URL.format(
            spreadsheet_id=spreadsheet_id,
            range_=quote(range_, safe="!':"),
        )
        payload = request_fn(url, "GET", None)
        if isinstance(payload, list):
            if len(payload) > limit:
                raise RowLimitExceeded(
                    f"Row count {len(payload)} exceeds data_max_rows={limit}"
                )
            return payload
        if isinstance(payload, dict) and "values" in payload:
            return _values_to_rows(payload["values"], max_rows=limit)
        raise ParseError("Unexpected Google Sheets mock payload")

    creds = load_google_credentials(credentials_info, settings=settings)
    token = resolve_access_token(creds, http_client=http_client)
    url = SHEETS_VALUES_URL.format(
        spreadsheet_id=spreadsheet_id,
        range_=quote(range_, safe="!':"),
    )
    headers = {"Authorization": f"Bearer {token}"}

    owns_client = http_client is None
    client = http_client or httpx.Client(timeout=30.0)
    try:
        resp = client.get(url, headers=headers)
        if resp.status_code == 401 or resp.status_code == 403:
            raise ConfigError(
                f"Google Sheets access denied ({resp.status_code})"
            )
        if resp.status_code >= 400:
            raise ParseError(
                f"Google Sheets API error ({resp.status_code}): {resp.text[:200]}"
            )
        data = resp.json()
        values = data.get("values") or []
        if not isinstance(values, list):
            raise ParseError("Google Sheets response missing values array")
        return _values_to_rows(values, max_rows=limit)
    finally:
        if owns_client:
            client.close()
