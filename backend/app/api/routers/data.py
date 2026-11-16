"""Data connectors API — Excel/CSV upload, Google Sheets, Yandex Tables."""

from __future__ import annotations

import base64
import logging
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.api.deps import AuthUser
from app.core.config import get_settings
from app.schemas.data import (
    AggregateRequest,
    CloudUrlRequest,
    DatasetOut,
    GoogleSheetRequest,
    YandexSheetRequest,
)
from app.services.connectors import aggregator
from app.services.connectors.cloud_url import from_cloud_url
from app.services.connectors.errors import ConfigError, ParseError, RowLimitExceeded

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/data", tags=["data"])


def _to_out(dataset: aggregator.Dataset) -> DatasetOut:
    return DatasetOut.model_validate(dataset.model_dump())


def _map_error(exc: Exception) -> HTTPException:
    if isinstance(exc, ConfigError):
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        )
    if isinstance(exc, RowLimitExceeded):
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    if isinstance(exc, ParseError):
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    logger.exception("Data connector unexpected error")
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Data connector failed",
    )


@router.post("/excel", response_model=DatasetOut)
async def upload_excel(
    current: AuthUser,
    file: UploadFile = File(...),
    sheet_name: str | None = Form(default=None),
) -> DatasetOut:
    """Parse multipart .xlsx / .csv → Dataset. Optional ``sheet_name`` for Excel."""
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="file is required",
        )
    name = file.filename.lower()
    if not (name.endswith(".xlsx") or name.endswith(".xlsm") or name.endswith(".csv")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="file must be .xlsx, .xlsm, or .csv",
        )
    data = await file.read()
    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="file is empty",
        )
    logger.info(
        "data.excel upload org=%s filename=%s size=%s sheet=%s",
        current.organization_id,
        file.filename,
        len(data),
        sheet_name,
    )
    try:
        dataset = aggregator.from_excel_bytes(
            data,
            filename=file.filename,
            sheet_name=(sheet_name.strip() if sheet_name else None),
        )
    except (ConfigError, ParseError, RowLimitExceeded) as exc:
        raise _map_error(exc) from exc
    return _to_out(dataset)


@router.post("/from-url", response_model=DatasetOut)
def fetch_from_url(current: AuthUser, body: CloudUrlRequest) -> DatasetOut:
    """Load Google/Yandex table by share URL; optional sheet_name for tab pick."""
    settings = get_settings()
    logger.info(
        "data.from-url org=%s url=%s sheet=%s",
        current.organization_id,
        (body.url or "")[:80],
        body.sheet_name,
    )
    try:
        dataset = from_cloud_url(
            body.url,
            sheet_name=(body.sheet_name.strip() if body.sheet_name else None),
            settings=settings,
        )
    except (ConfigError, ParseError, RowLimitExceeded) as exc:
        raise _map_error(exc) from exc
    return _to_out(dataset)


@router.post("/google", response_model=DatasetOut)
def fetch_google(current: AuthUser, body: GoogleSheetRequest) -> DatasetOut:
    settings = get_settings()
    logger.info(
        "data.google fetch org=%s spreadsheet_id=%s range=%s",
        current.organization_id,
        body.spreadsheet_id[:32],
        body.range[:64],
    )
    try:
        dataset = aggregator.from_google(
            body.spreadsheet_id,
            body.range,
            settings=settings,
        )
    except (ConfigError, ParseError, RowLimitExceeded) as exc:
        raise _map_error(exc) from exc
    return _to_out(dataset)


@router.post("/yandex", response_model=DatasetOut)
def fetch_yandex(current: AuthUser, body: YandexSheetRequest) -> DatasetOut:
    settings = get_settings()
    logger.info(
        "data.yandex fetch org=%s spreadsheet_id=%s range=%s",
        current.organization_id,
        body.spreadsheet_id[:64],
        body.range[:64],
    )
    try:
        dataset = aggregator.from_yandex(
            body.spreadsheet_id,
            body.range,
            settings=settings,
        )
    except (ConfigError, ParseError, RowLimitExceeded) as exc:
        raise _map_error(exc) from exc
    return _to_out(dataset)


@router.post("/aggregate", response_model=DatasetOut)
def aggregate_endpoint(current: AuthUser, body: AggregateRequest) -> DatasetOut:
    """Unified JSON entry: ``{source, spreadsheet_id?, range?, content_base64?}``."""
    settings = get_settings()
    logger.info(
        "data.aggregate org=%s source=%s",
        current.organization_id,
        body.source,
    )
    try:
        kwargs: dict[str, Any] = {"settings": settings}
        if body.source in ("excel", "csv"):
            if not body.content_base64:
                raise ParseError(
                    "aggregate excel/csv requires content_base64 "
                    "(or use POST /api/v1/data/excel multipart)"
                )
            kwargs["data"] = base64.b64decode(body.content_base64)
            kwargs["filename"] = body.filename or (
                "upload.csv" if body.source == "csv" else "upload.xlsx"
            )
        else:
            if not body.spreadsheet_id:
                raise ParseError("spreadsheet_id is required")
            kwargs["spreadsheet_id"] = body.spreadsheet_id
            kwargs["range"] = body.range or "Sheet1"
        dataset = aggregator.aggregate(body.source, **kwargs)
    except (ConfigError, ParseError, RowLimitExceeded) as exc:
        raise _map_error(exc) from exc
    return _to_out(dataset)
