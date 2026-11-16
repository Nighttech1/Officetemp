"""Unify Excel / Google / Yandex connectors into a Dataset contract."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal, Mapping

from pydantic import BaseModel, Field

from app.core.config import Settings, get_settings
from app.services.connectors import excel_parser, google_sheets, yandex_sheets
from app.services.connectors.errors import ParseError

SourceName = Literal["excel", "csv", "google", "yandex"]


class DatasetMeta(BaseModel):
    row_count: int = 0
    fetched_at: str
    extra: dict[str, Any] = Field(default_factory=dict)


class Dataset(BaseModel):
    source: SourceName
    columns: list[str]
    rows: list[dict[str, Any]]
    meta: DatasetMeta


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _columns_from_rows(rows: list[dict[str, Any]]) -> list[str]:
    if not rows:
        return []
    seen: list[str] = []
    for row in rows:
        for key in row.keys():
            if key not in seen:
                seen.append(key)
    return seen


def _build_dataset(
    source: SourceName,
    rows: list[dict[str, Any]],
    *,
    extra: dict[str, Any] | None = None,
    columns_override: list[str] | None = None,
) -> Dataset:
    row_columns = _columns_from_rows(rows)
    if columns_override:
        merged: list[str] = []
        seen: set[str] = set()
        for c in list(row_columns) + list(columns_override):
            if c and c not in seen:
                seen.add(c)
                merged.append(c)
        columns = merged
    else:
        columns = row_columns
    extra_out = dict(extra or {})
    if columns_override:
        extra_out.setdefault("all_columns", columns)
    return Dataset(
        source=source,
        columns=columns,
        rows=rows,
        meta=DatasetMeta(
            row_count=len(rows),
            fetched_at=_utc_now_iso(),
            extra=extra_out,
        ),
    )


def from_excel_bytes(
    data: bytes,
    *,
    filename: str | None = None,
    max_rows: int | None = None,
    sheet_name: str | None = None,
    settings: Settings | None = None,
) -> Dataset:
    settings = settings or get_settings()
    limit = max_rows if max_rows is not None else settings.data_max_rows
    name = (filename or "").lower()
    source: SourceName = "csv" if name.endswith(".csv") else "excel"
    extra: dict[str, Any] = {}
    if filename:
        extra["filename"] = filename

    all_columns: list[str] | None = None
    if source == "excel" or (not name.endswith(".csv") and data[:2] == b"PK"):
        # Один read_only проход: список листов + выбор + строки.
        # Старый путь (ExcelFile ×3) на ~6МБ Google export давал ~90с и 500 от proxy.
        sheets, chosen, rows, all_columns = excel_parser.parse_xlsx_fast(
            data,
            max_rows=limit,
            sheet_name=sheet_name,
        )
        extra["sheets"] = sheets
        extra["sheet_name"] = chosen
        extra["all_columns"] = all_columns
    else:
        rows = excel_parser.parse_excel_or_csv(
            data, filename=filename, max_rows=limit
        )
        extra["sheets"] = []
        extra["sheet_name"] = None

    return _build_dataset(
        source, rows, extra=extra, columns_override=all_columns
    )


def from_google(
    spreadsheet_id: str,
    range_: str,
    *,
    credentials_info: Mapping[str, Any] | None = None,
    max_rows: int | None = None,
    settings: Settings | None = None,
    http_client: Any = None,
    request_fn: Any = None,
) -> Dataset:
    rows = google_sheets.fetch_sheet(
        spreadsheet_id,
        range_,
        credentials_info=credentials_info,
        max_rows=max_rows,
        settings=settings,
        http_client=http_client,
        request_fn=request_fn,
    )
    return _build_dataset(
        "google",
        rows,
        extra={"spreadsheet_id": spreadsheet_id, "range": range_},
    )


def from_yandex(
    spreadsheet_id: str,
    range_: str = "Sheet1",
    *,
    token: str | None = None,
    max_rows: int | None = None,
    settings: Settings | None = None,
    http_client: Any = None,
    request_fn: Any = None,
) -> Dataset:
    rows = yandex_sheets.fetch_sheet(
        spreadsheet_id,
        range_,
        token=token,
        max_rows=max_rows,
        settings=settings,
        http_client=http_client,
        request_fn=request_fn,
    )
    return _build_dataset(
        "yandex",
        rows,
        extra={"spreadsheet_id": spreadsheet_id, "range": range_},
    )


def aggregate(source: str, **kwargs: Any) -> Dataset:
    """
    Unified entry: ``aggregate("excel", data=..., filename=...)`` /
    ``aggregate("google", spreadsheet_id=..., range_=...)`` /
    ``aggregate("yandex", spreadsheet_id=..., range_=...)``.
    """
    key = (source or "").strip().lower()
    if key in ("excel", "csv"):
        data = kwargs.get("data")
        if data is None:
            raise ParseError("aggregate(excel|csv) requires data=bytes")
        filename = kwargs.get("filename")
        if key == "csv" and filename is None:
            filename = "upload.csv"
        return from_excel_bytes(
            data,
            filename=filename,
            max_rows=kwargs.get("max_rows"),
            sheet_name=kwargs.get("sheet_name"),
            settings=kwargs.get("settings"),
        )
    if key == "google":
        spreadsheet_id = kwargs.get("spreadsheet_id")
        range_ = kwargs.get("range_") or kwargs.get("range")
        if not spreadsheet_id or not range_:
            raise ParseError(
                "aggregate(google) requires spreadsheet_id and range_/range"
            )
        return from_google(
            spreadsheet_id,
            range_,
            credentials_info=kwargs.get("credentials_info"),
            max_rows=kwargs.get("max_rows"),
            settings=kwargs.get("settings"),
            http_client=kwargs.get("http_client"),
            request_fn=kwargs.get("request_fn"),
        )
    if key == "yandex":
        spreadsheet_id = kwargs.get("spreadsheet_id")
        if not spreadsheet_id:
            raise ParseError("aggregate(yandex) requires spreadsheet_id")
        range_ = kwargs.get("range_") or kwargs.get("range") or "Sheet1"
        return from_yandex(
            spreadsheet_id,
            range_,
            token=kwargs.get("token"),
            max_rows=kwargs.get("max_rows"),
            settings=kwargs.get("settings"),
            http_client=kwargs.get("http_client"),
            request_fn=kwargs.get("request_fn"),
        )
    raise ParseError(
        f"Unknown data source '{source}'; use excel|csv|google|yandex"
    )
