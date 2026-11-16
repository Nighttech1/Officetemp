"""Global signature library API — one shared library for every account.

Любой авторизованный аккаунт получает и правит одну и ту же библиотеку:
данные не зависят от organization_id. Фронт логинится дев-сессией сам,
поэтому библиотека грузится «вместе с приложением» независимо от входа.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.api.deps import AuthUser, DbSession
from app.schemas.signature_library import (
    PutSignatureLibraryRequest,
    PutSignatureLibraryResponse,
    SignatureLibraryResponse,
)
from app.services.signature_library_service import GlobalSignatureLibraryService

router = APIRouter(prefix="/signatures", tags=["signatures"])


@router.get("/library", response_model=SignatureLibraryResponse)
def get_library(current: AuthUser, db: DbSession) -> SignatureLibraryResponse:
    svc = GlobalSignatureLibraryService(db)
    lib = svc.get()
    return SignatureLibraryResponse(
        library=lib,
        server_revision=lib.revision,
        empty=svc.is_empty(),
    )


@router.put("/library", response_model=PutSignatureLibraryResponse)
def put_library(
    body: PutSignatureLibraryRequest,
    current: AuthUser,
    db: DbSession,
) -> PutSignatureLibraryResponse:
    svc = GlobalSignatureLibraryService(db)
    empty = svc.is_empty()
    imported = False

    if body.migrate_local:
        if not empty:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Global signature library already has data; migrate_local refused",
            )
        imported = True

    if body.expected_revision is not None and not empty:
        current_rev = svc.get().revision
        if body.expected_revision != current_rev:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "revision_conflict",
                    "server_revision": current_rev,
                    "expected_revision": body.expected_revision,
                },
            )

    rev = svc.replace(body.library)
    db.commit()
    return PutSignatureLibraryResponse(ok=True, server_revision=rev, imported=imported)
