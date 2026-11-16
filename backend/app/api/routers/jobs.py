"""Async generation jobs API — Celery-backed batch DOCX/PDF + ZIP download."""

from __future__ import annotations

import json
import uuid
from typing import Any, Literal

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from app.api.deps import AuthUser, DbSession
from app.core.config import get_settings
from app.models.job import Job
from app.services.job_artifacts import RESULT_ZIP_NAME, job_dir, save_job_payload

router = APIRouter(prefix="/jobs", tags=["jobs"])

OutputFormat = Literal["docx", "pdf", "both"]


class JobCreated(BaseModel):
    id: uuid.UUID
    status: str


class JobStatus(BaseModel):
    id: uuid.UUID
    status: str
    total_rows: int
    done_rows: int
    progress_percent: float = Field(ge=0, le=100)
    output_format: str
    error: str | None = None
    created_at: str | None = None
    updated_at: str | None = None


def _parse_rows(rows_raw: str) -> list[dict[str, Any]]:
    try:
        data = json.loads(rows_raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid rows JSON: {exc}",
        ) from exc
    if not isinstance(data, list):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="rows must be a JSON array",
        )
    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="rows must not be empty",
        )
    settings = get_settings()
    max_rows = max(1, int(settings.data_max_rows or 5000))
    if len(data) > max_rows:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"rows exceeds max {max_rows}",
        )
    cleaned: list[dict[str, Any]] = []
    for i, item in enumerate(data):
        if not isinstance(item, dict):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"rows[{i}] must be a JSON object",
            )
        cleaned.append(item)
    return cleaned


def _normalize_output(output: str) -> str:
    value = (output or "docx").strip().lower()
    if value not in ("docx", "pdf", "both"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="output must be docx, pdf, or both",
        )
    return value


async def _read_template(template: UploadFile) -> bytes:
    if not template.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="template file is required",
        )
    if not template.filename.lower().endswith(".docx"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="template must be a .docx file",
        )
    data = await template.read()
    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="template file is empty",
        )
    return data


def _get_tenant_job(db: DbSession, current: AuthUser, job_id: uuid.UUID) -> Job:
    job = db.get(Job, job_id)
    if job is None or job.organization_id != current.organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )
    return job


@router.post("", response_model=JobCreated, status_code=status.HTTP_201_CREATED)
async def create_job(
    current: AuthUser,
    db: DbSession,
    template: UploadFile = File(...),
    rows: str = Form(...),
    output: str = Form("docx"),
) -> JobCreated:
    """Enqueue a batch generation job. Payload stored on disk (not in Redis)."""
    row_list = _parse_rows(rows)
    output_format = _normalize_output(output)
    template_bytes = await _read_template(template)

    job_id = uuid.uuid4()
    save_job_payload(
        current.organization_id,
        job_id,
        template_bytes=template_bytes,
        rows=row_list,
    )

    job = Job(
        id=job_id,
        organization_id=current.organization_id,
        created_by=current.id,
        status="queued",
        total_rows=len(row_list),
        done_rows=0,
        error=None,
        zip_path=None,
        output_format=output_format,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Import late so eager/settings apply; enqueue after commit.
    from app.worker.tasks import run_generation_job

    run_generation_job.delay(str(job.id))

    # Eager mode may have already finished; re-read status.
    db.refresh(job)
    return JobCreated(id=job.id, status=job.status)


@router.get("/{job_id}", response_model=JobStatus)
def get_job(
    job_id: uuid.UUID,
    current: AuthUser,
    db: DbSession,
) -> JobStatus:
    job = _get_tenant_job(db, current, job_id)
    total = max(0, int(job.total_rows or 0))
    done = max(0, int(job.done_rows or 0))
    if job.status == "done":
        pct = 100.0
    elif total <= 0:
        pct = 0.0
    else:
        pct = min(100.0, round(100.0 * done / total, 2))
    return JobStatus(
        id=job.id,
        status=job.status,
        total_rows=total,
        done_rows=done,
        progress_percent=pct,
        output_format=job.output_format,
        error=job.error,
        created_at=job.created_at.isoformat() if job.created_at else None,
        updated_at=job.updated_at.isoformat() if job.updated_at else None,
    )


@router.get("/{job_id}/download")
def download_job_zip(
    job_id: uuid.UUID,
    current: AuthUser,
    db: DbSession,
) -> FileResponse:
    job = _get_tenant_job(db, current, job_id)
    if job.status != "done":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Job not ready (status={job.status})",
        )
    path = job_dir(job.organization_id, job.id) / RESULT_ZIP_NAME
    if job.zip_path:
        candidate = path if path.is_file() else None
        if candidate is None:
            from pathlib import Path

            alt = Path(job.zip_path)
            if alt.is_file():
                candidate = alt
        path = candidate if candidate is not None else path
    if not path.is_file():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="ZIP not available",
        )
    return FileResponse(
        path=path,
        media_type="application/zip",
        filename=f"job-{job.id}.zip",
    )
