"""Document generation API — DOCX / PDF fill via Doc Engine."""

from __future__ import annotations

import json
import uuid
from typing import Any
from urllib.parse import quote

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.deps import AuthUser, DbSession
from app.models.generation_log import GenerationLog
from app.services.doc_engine import PdfConversionUnavailable, convert_docx_to_pdf, render_docx
from app.services.doc_engine.pdf_convert import RUNTIME_TMP_ROOT

router = APIRouter(prefix="/generate", tags=["generate"])

RUNTIME_TMP = RUNTIME_TMP_ROOT
DOCX_MEDIA = (
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
)


def _parse_context(context: str) -> dict[str, Any]:
    try:
        data = json.loads(context)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid context JSON: {exc}",
        ) from exc
    if not isinstance(data, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="context must be a JSON object",
        )
    return data


def _safe_meta(
    *,
    output_format: str,
    context: dict[str, Any],
    template_filename: str | None,
    template_size: int,
    output_size: int | None = None,
    error: str | None = None,
) -> dict[str, Any]:
    """Store only keys / sizes / status — never full PII context values."""
    meta: dict[str, Any] = {
        "output_format": output_format,
        "context_keys": sorted(str(k) for k in context.keys()),
        "context_key_count": len(context),
        "template_filename": template_filename,
        "template_size": template_size,
    }
    if output_size is not None:
        meta["output_size"] = output_size
    if error:
        meta["error"] = error[:500]
    return meta


def _write_log(
    db: Session,
    *,
    org_id: uuid.UUID,
    user_id: uuid.UUID,
    status_value: str,
    meta: dict[str, Any],
) -> None:
    row = GenerationLog(
        id=uuid.uuid4(),
        organization_id=org_id,
        template_id=None,
        status=status_value,
        created_by=user_id,
        meta=meta,
    )
    db.add(row)
    db.commit()


async def _read_template(template: UploadFile) -> tuple[bytes, str | None]:
    if not template.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="template file is required",
        )
    name = template.filename.lower()
    if not name.endswith(".docx"):
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
    return data, template.filename


def _content_disposition(download_name: str) -> str:
    """ASCII fallback + RFC 5987 filename* so Cyrillic names do not crash Starlette."""
    ascii_name = "".join(ch if ord(ch) < 128 else "_" for ch in download_name) or "document"
    if not ascii_name.lower().endswith((".docx", ".pdf")):
        ascii_name = f"{ascii_name}.bin"
    starred = quote(download_name, safe="")
    return f"attachment; filename=\"{ascii_name}\"; filename*=UTF-8''{starred}"


@router.post("/docx")
async def generate_docx(
    current: AuthUser,
    db: DbSession,
    template: UploadFile = File(...),
    context: str = Form(...),
) -> Response:
    ctx = _parse_context(context)
    template_bytes, filename = await _read_template(template)
    try:
        rendered = render_docx(template_bytes, ctx)
    except Exception as exc:  # noqa: BLE001 — surface as failed generation
        _write_log(
            db,
            org_id=current.organization_id,
            user_id=current.id,
            status_value="failed",
            meta=_safe_meta(
                output_format="docx",
                context=ctx,
                template_filename=filename,
                template_size=len(template_bytes),
                error=str(exc),
            ),
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"DOCX render failed: {exc}",
        ) from exc

    _write_log(
        db,
        org_id=current.organization_id,
        user_id=current.id,
        status_value="success",
        meta=_safe_meta(
            output_format="docx",
            context=ctx,
            template_filename=filename,
            template_size=len(template_bytes),
            output_size=len(rendered),
        ),
    )
    out_name = (filename or "document.docx").rsplit(".", 1)[0] + "_filled.docx"
    return Response(
        content=rendered,
        media_type=DOCX_MEDIA,
        headers={"Content-Disposition": _content_disposition(out_name)},
    )


@router.post("/pdf")
async def generate_pdf(
    current: AuthUser,
    db: DbSession,
    template: UploadFile = File(...),
    context: str = Form(...),
) -> Response:
    ctx = _parse_context(context)
    template_bytes, filename = await _read_template(template)
    try:
        rendered = render_docx(template_bytes, ctx)
        work = RUNTIME_TMP / str(current.organization_id)
        pdf_bytes = convert_docx_to_pdf(rendered, work_dir=work)
    except PdfConversionUnavailable as exc:
        _write_log(
            db,
            org_id=current.organization_id,
            user_id=current.id,
            status_value="failed",
            meta=_safe_meta(
                output_format="pdf",
                context=ctx,
                template_filename=filename,
                template_size=len(template_bytes),
                error=str(exc),
            ),
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        _write_log(
            db,
            org_id=current.organization_id,
            user_id=current.id,
            status_value="failed",
            meta=_safe_meta(
                output_format="pdf",
                context=ctx,
                template_filename=filename,
                template_size=len(template_bytes),
                error=str(exc),
            ),
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"PDF generation failed: {exc}",
        ) from exc

    _write_log(
        db,
        org_id=current.organization_id,
        user_id=current.id,
        status_value="success",
        meta=_safe_meta(
            output_format="pdf",
            context=ctx,
            template_filename=filename,
            template_size=len(template_bytes),
            output_size=len(pdf_bytes),
        ),
    )
    out_name = (filename or "document.docx").rsplit(".", 1)[0] + "_filled.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": _content_disposition(out_name)},
    )
