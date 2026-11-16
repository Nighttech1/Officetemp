"""Storage: org-scoped upload/download (API proxy) + optional presign."""

from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from fastapi.responses import Response

from app.api.deps import AuthUser
from app.schemas.storage import (
    PresignDownloadRequest,
    PresignUploadRequest,
    PresignUploadResponse,
    StorageObjectResponse,
)
from app.services.s3_storage import S3StorageService

router = APIRouter(prefix="/storage", tags=["storage"])

_MAX_UPLOAD_BYTES = 40 * 1024 * 1024  # 40 MiB


@router.post("/presign-upload", response_model=PresignUploadResponse)
def presign_upload(
    body: PresignUploadRequest,
    current: AuthUser,
) -> PresignUploadResponse:
    storage = S3StorageService()
    storage.ensure_bucket()
    key = storage.build_template_key(current.organization_id, body.filename)
    result = storage.presign_upload(key, content_type=body.content_type)
    return PresignUploadResponse(**result)


@router.post("/presign-download", response_model=PresignUploadResponse)
def presign_download(
    body: PresignDownloadRequest,
    current: AuthUser,
) -> PresignUploadResponse:
    storage = S3StorageService()
    if not storage.org_owns_key(current.organization_id, body.key):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Key not in org scope")
    result = storage.presign_download(body.key)
    return PresignUploadResponse(**result)


@router.post("/objects", response_model=StorageObjectResponse)
async def upload_object(
    current: AuthUser,
    file: UploadFile = File(...),
    doc_id: str | None = Form(default=None),
    kind: str = Form(default="template"),
) -> StorageObjectResponse:
    """Upload Word/Excel via API → local disk volume (or S3 if STORAGE_BACKEND=s3)."""
    raw = await file.read()
    if len(raw) > _MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File too large",
        )
    storage = S3StorageService()
    filename = file.filename or "upload.bin"
    if doc_id:
        key = storage.build_doc_blob_key(
            current.organization_id, doc_id, kind, filename_hint=filename
        )
    else:
        key = storage.build_template_key(current.organization_id, filename)
    backend = storage.put_bytes(key, raw, content_type=file.content_type)
    return StorageObjectResponse(
        key=key,
        bytes=len(raw),
        backend=backend,
        content_type=file.content_type,
    )


@router.get("/objects")
def download_object(key: str, current: AuthUser) -> Response:
    storage = S3StorageService()
    if not storage.org_owns_key(current.organization_id, key):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Key not in org scope")
    try:
        data, ctype = storage.get_bytes(key)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Object not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid key") from exc
    return Response(
        content=data,
        media_type=ctype or "application/octet-stream",
        headers={"Content-Disposition": "attachment"},
    )
