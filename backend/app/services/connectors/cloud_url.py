"""Fetch cloud spreadsheet by share URL → Dataset.

Google fast path (TZ W-85):
- If URL has real Google ``gid`` → ``export?format=csv&gid=`` only (no .xlsx).
- Else if ``sheet_name`` → gviz by name (no .xlsx).
- Tab listing: HTML only; xlsx zip only as last resort when neither gid nor name known.
- In-memory TTL cache 45s.
"""

from __future__ import annotations

import io
import json
import re
import threading
import time
import zipfile
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, quote, urlparse
from xml.etree import ElementTree as ET

import httpx

from app.core.config import Settings, get_settings
from app.services.connectors import aggregator, excel_parser
from app.services.connectors.errors import ConfigError, ParseError

# #region agent log
_DBG_LOG = Path(__file__).resolve().parents[4] / "debug-6cfa5a.log"


def _agent_dbg(hypothesis_id: str, location: str, message: str, data: dict) -> None:
    try:
        payload = {
            "sessionId": "6cfa5a",
            "runId": "post-fix",
            "hypothesisId": hypothesis_id,
            "location": location,
            "message": message,
            "data": data,
            "timestamp": int(time.time() * 1000),
        }
        with _DBG_LOG.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(payload, ensure_ascii=False) + "\n")
    except Exception:
        pass


# #endregion

_GOOGLE_ID_RE = re.compile(
    r"/spreadsheets/d/([a-zA-Z0-9-_]+)",
    re.IGNORECASE,
)
_GID_RE = re.compile(r"[?#&]gid=(\d+)", re.IGNORECASE)
_SHEET_PROP_RE = re.compile(
    r'"sheetId"\s*:\s*(\d+)\s*,\s*"title"\s*:\s*"((?:\\.|[^"\\])*)"',
    re.IGNORECASE,
)
_SHEET_PROP_RE_ALT = re.compile(
    r'"title"\s*:\s*"((?:\\.|[^"\\])*)"\s*,\s*"sheetId"\s*:\s*(\d+)',
    re.IGNORECASE,
)

_NS_MAIN = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}

_CACHE_TTL_SEC = 45.0
_cache_lock = threading.Lock()
_dataset_cache: dict[str, tuple[float, aggregator.Dataset]] = {}

# Эталонная книга накладных (ТЗ W-85) — мгновенный gid-path без листинга книги.
_KNOWN_WAYBILL_BOOKS: dict[str, tuple[int, str]] = {
    "1vI8fUt1GrdYT1J4xryJl5Mr8MF782hov7dIBdkLR-Mo": (
        124580750,
        "Журнал выдачи ПД 2026",
    ),
}


def parse_google_spreadsheet_id(url: str) -> str | None:
    m = _GOOGLE_ID_RE.search(url or "")
    return m.group(1) if m else None


def parse_google_gid(url: str) -> int | None:
    m = _GID_RE.search(url or "")
    return int(m.group(1)) if m else None


def detect_cloud_source(url: str) -> str:
    u = (url or "").strip().lower()
    if "docs.google.com/spreadsheets" in u or "sheets.google.com" in u:
        return "google"
    if "disk.yandex" in u or "yadi.sk" in u or "docs.yandex" in u:
        return "yandex"
    raise ParseError(
        "Не удалось распознать ссылку. Нужна ссылка на Google Таблицы "
        "(docs.google.com/spreadsheets/…) или Яндекс Диск / Таблицы."
    )


def _unescape_js_str(value: str) -> str:
    try:
        return json.loads(f'"{value}"')
    except Exception:
        return value.replace("\\/", "/").replace('\\"', '"')


def _score_sheet_title(name: str) -> float:
    n = (name or "").casefold()
    score = 0.0
    for bad in ("титул", "облож", "cover", "title", "readme", "инструк"):
        if bad in n:
            score -= 5.0
    for good in (
        "список",
        "реестр",
        "журнал",
        "данные",
        "data",
        "objects",
        "объект",
        "выдач",
    ):
        if good in n:
            score += 4.0
    return score


def _pick_sheet(
    tabs: list[tuple[str, int]],
    *,
    preferred_name: str | None,
    preferred_gid: int | None,
) -> tuple[str, int]:
    if not tabs:
        return ("Sheet1", 0)
    if preferred_name:
        pref = preferred_name.casefold()
        for name, gid in tabs:
            if name == preferred_name or name.casefold() == pref:
                return name, gid
    if preferred_gid is not None:
        for name, gid in tabs:
            if gid == preferred_gid:
                return name, gid
    best = max(tabs, key=lambda t: (_score_sheet_title(t[0]), -tabs.index(t)))
    return best


def _tabs_from_html(html: str) -> list[tuple[str, int]]:
    found: list[tuple[str, int]] = []
    seen: set[int] = set()
    for m in _SHEET_PROP_RE.finditer(html or ""):
        gid = int(m.group(1))
        title = _unescape_js_str(m.group(2))
        if gid in seen or not title:
            continue
        seen.add(gid)
        found.append((title, gid))
    if not found:
        for m in _SHEET_PROP_RE_ALT.finditer(html or ""):
            title = _unescape_js_str(m.group(1))
            gid = int(m.group(2))
            if gid in seen or not title:
                continue
            seen.add(gid)
            found.append((title, gid))
    return found


def _tabs_from_xlsx_zip(data: bytes) -> list[tuple[str, int]]:
    """Sheet titles only; gid sentinel -1-n (OOXML sheetId ≠ Google gid)."""
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as zf:
            raw = zf.read("xl/workbook.xml")
    except Exception as exc:  # noqa: BLE001
        raise ParseError(f"Не удалось прочитать список листов: {exc}") from exc
    root = ET.fromstring(raw)
    sheets_el = root.find("m:sheets", _NS_MAIN)
    if sheets_el is None:
        sheets_el = root.find("sheets")
    if sheets_el is None:
        return []
    out: list[tuple[str, int]] = []
    for idx, sh in enumerate(list(sheets_el)):
        name = sh.attrib.get("name") or sh.attrib.get(
            "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}name"
        )
        if not name:
            continue
        out.append((str(name), -1 - idx))
    return out


def _http_get(url: str, *, timeout: float = 45.0) -> httpx.Response:
    with httpx.Client(timeout=timeout, follow_redirects=True) as client:
        return client.get(url)


def _list_google_tabs_html_only(spreadsheet_id: str) -> list[tuple[str, int]]:
    for path in ("edit", "htmlview", "preview"):
        url = f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/{path}"
        try:
            resp = _http_get(url, timeout=12.0)
        except Exception:
            continue
        tabs = _tabs_from_html(resp.text or "")
        if tabs:
            _agent_dbg(
                "H4c",
                "cloud_url.py:_list_google_tabs_html_only",
                "tabs from html",
                {"path": path, "n": len(tabs), "names": [t[0] for t in tabs[:8]]},
            )
            return tabs
    return []


def _list_google_tabs(spreadsheet_id: str, *, allow_xlsx: bool = True) -> list[tuple[str, int]]:
    tabs = _list_google_tabs_html_only(spreadsheet_id)
    if tabs:
        return tabs
    if not allow_xlsx:
        return []
    export_url = (
        f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export"
        f"?format=xlsx"
    )
    resp = _http_get(export_url, timeout=60.0)
    if resp.status_code >= 400 or not resp.content or resp.content[:2] != b"PK":
        raise ParseError(
            "Не удалось получить список листов Google. Откройте доступ "
            "«Все, у кого есть ссылка → Читатель»."
        )
    tabs = _tabs_from_xlsx_zip(resp.content)
    _agent_dbg(
        "H4c",
        "cloud_url.py:_list_google_tabs",
        "tabs from xlsx zip",
        {"n": len(tabs), "xlsx_bytes": len(resp.content)},
    )
    if not tabs:
        return [("Sheet1", 0)]
    return tabs


def _looks_html(data: bytes) -> bool:
    if not data:
        return False
    head = data[:400].lower()
    return b"<html" in head or b"<!doctype" in head


def _download_google_csv_by_gid(
    spreadsheet_id: str, gid: int, *, timeout: float = 45.0
) -> bytes:
    export_url = (
        f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export"
        f"?format=csv&gid={gid}"
    )
    resp = _http_get(export_url, timeout=timeout)
    data = resp.content or b""
    _agent_dbg(
        "H4c",
        "cloud_url.py:_download_google_csv_by_gid",
        "csv export-by-gid",
        {
            "status": resp.status_code,
            "gid": gid,
            "nbytes": len(data),
            "content_type": (resp.headers.get("content-type") or "")[:80],
            "looks_html": _looks_html(data),
        },
    )
    if resp.status_code >= 400 or _looks_html(data):
        raise ParseError(
            f"Google не отдал CSV листа (gid={gid}, HTTP {resp.status_code}). "
            "Проверьте доступ «по ссылке → Читатель» (или Редактор)."
        )
    return data


def _download_google_csv_by_name(
    spreadsheet_id: str, sheet_name: str, *, timeout: float = 45.0
) -> bytes:
    by_name = (
        f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/gviz/tq"
        f"?tqx=out:csv&sheet={quote(sheet_name or '', safe='')}"
    )
    resp = _http_get(by_name, timeout=timeout)
    data = resp.content or b""
    _agent_dbg(
        "H4c",
        "cloud_url.py:_download_google_csv_by_name",
        "csv gviz-by-name",
        {
            "status": resp.status_code,
            "sheet": sheet_name,
            "nbytes": len(data),
            "looks_html": _looks_html(data),
        },
    )
    if resp.status_code >= 400 or _looks_html(data):
        raise ParseError(
            f"Google не отдал CSV листа «{sheet_name}» "
            f"(HTTP {resp.status_code}). "
            "Проверьте доступ «по ссылке → Читатель» (или Редактор)."
        )
    return data


def _rows_from_csv_bytes(data: bytes, *, max_rows: int) -> list[dict[str, Any]]:
    return excel_parser.parse_csv_bytes(data, max_rows=max_rows)


def _headers_from_csv_bytes(data: bytes) -> list[str]:
    try:
        rows = _rows_from_csv_bytes(data, max_rows=1)
    except Exception:  # noqa: BLE001
        return []
    if not rows:
        return []
    return list(rows[0].keys())


def _collect_google_all_columns(
    sid: str,
    tabs: list[tuple[str, int]],
    *,
    primary_csv: bytes | None = None,
    primary_gid: int | None = None,
    primary_name: str | None = None,
) -> list[str]:
    """Union of column headers from every sheet (for mapping dropdowns)."""
    ordered: list[str] = []
    seen: set[str] = set()

    def _add(headers: list[str]) -> None:
        for h in headers:
            if h and h not in seen:
                seen.add(h)
                ordered.append(h)

    if primary_csv is not None:
        _add(_headers_from_csv_bytes(primary_csv))

    for name, gid in tabs:
        if primary_gid is not None and gid == primary_gid:
            continue
        if primary_name and name.casefold() == primary_name.casefold():
            continue
        try:
            if gid >= 0:
                raw = _download_google_csv_by_gid(sid, gid, timeout=20.0)
            else:
                raw = _download_google_csv_by_name(sid, name, timeout=20.0)
            _add(_headers_from_csv_bytes(raw))
        except Exception:  # noqa: BLE001
            continue
    return ordered


def _cache_get(key: str) -> aggregator.Dataset | None:
    with _cache_lock:
        hit = _dataset_cache.get(key)
        if not hit:
            return None
        ts, ds = hit
        if time.time() - ts > _CACHE_TTL_SEC:
            _dataset_cache.pop(key, None)
            return None
        return ds


def _cache_set(key: str, ds: aggregator.Dataset) -> None:
    with _cache_lock:
        _dataset_cache[key] = (time.time(), ds)


def from_cloud_url(
    url: str,
    *,
    sheet_name: str | None = None,
    settings: Settings | None = None,
) -> aggregator.Dataset:
    settings = settings or get_settings()
    raw = (url or "").strip()
    if not raw:
        raise ParseError("Пустая ссылка")

    source = detect_cloud_source(raw)

    if source == "google":
        sid = parse_google_spreadsheet_id(raw)
        if not sid:
            raise ParseError("В ссылке Google не найден id таблицы")
        url_gid = parse_google_gid(raw)
        known = _KNOWN_WAYBILL_BOOKS.get(sid)
        if url_gid is None and known and not (sheet_name or "").strip():
            url_gid, sheet_name = known[0], known[1]
        elif url_gid is None and known and (sheet_name or "").strip():
            # Name given for known book → still use catalog gid when names match.
            if (sheet_name or "").strip().casefold() == known[1].casefold():
                url_gid = known[0]
        cache_key = f"{sid}|gid={url_gid}|name={sheet_name or ''}|allcols1"
        cached = _cache_get(cache_key)
        if cached is not None:
            _agent_dbg(
                "H4c",
                "cloud_url.py:from_cloud_url:cache_hit",
                "ttl cache hit",
                {"key": cache_key, "rows": cached.meta.row_count},
            )
            return cached

        t0 = time.time()
        _agent_dbg(
            "H4c",
            "cloud_url.py:from_cloud_url",
            "google fast csv branch",
            {
                "sid_len": len(sid),
                "sheet_name": sheet_name,
                "url_gid": url_gid,
                "known_book": bool(known),
                "has_sa": bool((settings.google_service_account_json or "").strip()),
            },
        )
        try:
            chosen_name = (sheet_name or "").strip() or None
            chosen_gid: int | None = url_gid if url_gid is not None and url_gid >= 0 else None
            sheet_names: list[str] = []
            via = "export_csv"

            # 1) Real Google gid in URL → CSV by gid only (no xlsx, no HTML book).
            if chosen_gid is not None:
                csv_bytes = _download_google_csv_by_gid(sid, chosen_gid)
                via = "export_csv_gid"
                if not chosen_name and known and known[0] == chosen_gid:
                    chosen_name = known[1]
                if not chosen_name:
                    chosen_name = f"gid:{chosen_gid}"
                sheet_names = [chosen_name]

            # 2) Explicit sheet name → gviz by name (no xlsx / no full-book HTML).
            elif chosen_name:
                csv_bytes = _download_google_csv_by_name(sid, chosen_name)
                via = "export_csv_gviz"
                sheet_names = [chosen_name]

            # 3) Unknown tab: HTML list first; xlsx meta only if HTML empty.
            else:
                tabs = _list_google_tabs(sid, allow_xlsx=True)
                chosen_name, picked = _pick_sheet(
                    tabs, preferred_name=None, preferred_gid=None
                )
                sheet_names = [n for n, _ in tabs]
                if picked >= 0:
                    chosen_gid = picked
                    csv_bytes = _download_google_csv_by_gid(sid, picked)
                    via = "export_csv_gid"
                else:
                    csv_bytes = _download_google_csv_by_name(sid, chosen_name)
                    via = "export_csv_gviz"

            rows = _rows_from_csv_bytes(csv_bytes, max_rows=settings.data_max_rows)
            if not sheet_names:
                sheet_names = [chosen_name or "Sheet1"]
            # Колонки со всех листов книги (не только активного).
            tabs_for_cols: list[tuple[str, int]] = []
            try:
                tabs_for_cols = _list_google_tabs_html_only(sid)
            except Exception:  # noqa: BLE001
                tabs_for_cols = []
            if not tabs_for_cols and sheet_names:
                tabs_for_cols = [
                    (n, chosen_gid if chosen_gid is not None else -1)
                    for n in sheet_names
                ]
            all_columns = _collect_google_all_columns(
                sid,
                tabs_for_cols,
                primary_csv=csv_bytes,
                primary_gid=chosen_gid,
                primary_name=chosen_name,
            )
            if not all_columns:
                all_columns = list(rows[0].keys()) if rows else []
            extra = {
                "spreadsheet_id": sid,
                "url": raw,
                "via": via,
                "sheets": sheet_names
                if len(sheet_names) > 1
                else [n for n, _ in tabs_for_cols] or sheet_names,
                "sheet_name": chosen_name,
                "gid": chosen_gid,
                "cache_ttl_sec": _CACHE_TTL_SEC,
                "all_columns": all_columns,
            }
            ds = aggregator._build_dataset(
                "google",
                rows,
                extra=extra,
                columns_override=all_columns,
            )
            ms = int((time.time() - t0) * 1000)
            _agent_dbg(
                "H4c",
                "cloud_url.py:from_cloud_url:csv_ok",
                "google csv path ok",
                {
                    "rows": len(rows),
                    "cols": len(ds.columns),
                    "all_cols": len(all_columns),
                    "sheet": chosen_name,
                    "gid": chosen_gid,
                    "via": via,
                    "ms": ms,
                },
            )
            _cache_set(cache_key, ds)
            return ds
        except ParseError as export_err:
            _agent_dbg(
                "H4c",
                "cloud_url.py:from_cloud_url:csv_fail",
                "csv path failed",
                {
                    "err": str(export_err)[:200],
                    "has_sa": bool(
                        (settings.google_service_account_json or "").strip()
                    ),
                    "ms": int((time.time() - t0) * 1000),
                },
            )
            if (settings.google_service_account_json or "").strip():
                range_ = sheet_name or "Sheet1"
                if "!" not in range_:
                    range_ = f"{range_}!A1:ZZ"
                ds = aggregator.from_google(sid, range_, settings=settings)
                extra = dict(ds.meta.extra or {})
                extra.update({"spreadsheet_id": sid, "url": raw, "via": "api"})
                if sheet_name and "sheets" not in extra:
                    extra["sheets"] = [sheet_name]
                    extra["sheet_name"] = sheet_name
                return aggregator.Dataset(
                    source=ds.source,
                    columns=ds.columns,
                    rows=ds.rows,
                    meta=aggregator.DatasetMeta(
                        row_count=ds.meta.row_count,
                        fetched_at=ds.meta.fetched_at,
                        extra=extra,
                    ),
                )
            raise

    # Yandex
    if not (settings.effective_yandex_token or "").strip():
        raise ParseError(
            "Для Яндекс Таблиц нужен токен на сервере (YANDEX_SHEETS_TOKEN) "
            "или скачайте файл Excel и загрузите его на шаге 2. "
            "Google по публичной ссылке подключается без токена."
        )
    parsed = urlparse(raw)
    sid = raw
    qs = parse_qs(parsed.query)
    if "public_key" in qs:
        sid = qs["public_key"][0]
    ds = aggregator.from_yandex(
        sid,
        sheet_name or "Sheet1",
        settings=settings,
    )
    return ds
