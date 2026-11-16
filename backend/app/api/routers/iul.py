"""IUL helpers — analyze PDF title block for autofill."""

from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.api.deps import AuthUser
from app.services.iul_stamp import analyze_stamp_pdf, result_to_dict

router = APIRouter(prefix="/iul", tags=["iul"])

MAX_PDF_BYTES = 100 * 1024 * 1024


@router.post("/analyze-pdf")
async def analyze_iul_pdf(
    current: AuthUser,
    file: UploadFile = File(...),
    extract_signatures: bool = Form(True),
) -> dict:
    """Parse GOST stamp from a drawing PDF. Does not persist the file."""
    _ = current
    name = file.filename or "document.pdf"
    if not name.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нужен файл PDF",
        )
    data = await file.read()
    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пустой файл",
        )
    if len(data) > MAX_PDF_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PDF слишком большой (макс. 100 МБ)",
        )
    try:
        result = analyze_stamp_pdf(
            data,
            name,
            extract_signatures=extract_signatures,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Не удалось разобрать PDF: {exc}",
        ) from exc
    return result_to_dict(result)
