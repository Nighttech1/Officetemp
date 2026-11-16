"""Pydantic schemas for data connector API."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class DatasetMetaOut(BaseModel):
    row_count: int
    fetched_at: str
    extra: dict[str, Any] = Field(default_factory=dict)


class DatasetOut(BaseModel):
    source: Literal["excel", "csv", "google", "yandex"]
    columns: list[str]
    rows: list[dict[str, Any]]
    meta: DatasetMetaOut


class GoogleSheetRequest(BaseModel):
    spreadsheet_id: str = Field(..., min_length=1)
    range: str = Field(..., min_length=1, description="A1 range, e.g. Sheet1!A1:Z")


class YandexSheetRequest(BaseModel):
    spreadsheet_id: str = Field(
        ...,
        min_length=1,
        description="Yandex Disk path or resource id (e.g. disk:/tables/registry.xlsx)",
    )
    range: str = Field(default="Sheet1", description="Sheet name / range (API symmetry)")


class AggregateRequest(BaseModel):
    source: Literal["excel", "csv", "google", "yandex"]
    # Google / Yandex
    spreadsheet_id: str | None = None
    range: str | None = None
    # Excel/csv via aggregate JSON is not for multipart; use /excel for uploads.
    # Optional base64 payload for programmatic aggregate of small sheets:
    content_base64: str | None = None
    filename: str | None = None


class CloudUrlRequest(BaseModel):
    url: str = Field(..., min_length=8, description="Share URL to Google / Yandex table")
    sheet_name: str | None = Field(
        default=None,
        description="Sheet/tab name inside the workbook",
    )
