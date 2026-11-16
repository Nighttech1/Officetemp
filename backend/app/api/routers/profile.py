"""Profile / subject-rights API (152-ФЗ) — all PII via PiiService."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from sqlalchemy.exc import IntegrityError

from app.api.deps import AuthUser, DbSession
from app.models.user import User
from app.schemas.profile import (
    ProfileExportResponse,
    ProfileUpdateRequest,
    ProfileViewResponse,
)
from app.services.pii_service import PiiService

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/me", response_model=ProfileViewResponse)
def get_my_profile(current: AuthUser, db: DbSession) -> ProfileViewResponse:
    pii = PiiService(db)
    profile = pii.get_profile_by_user_id(current.id, actor_user_id=current.id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    db.commit()
    return ProfileViewResponse(
        user_id=str(profile.user_id),
        email=profile.email,
        full_name=profile.full_name,
        phone=profile.phone,
        consent_at=profile.consent_at.isoformat() if profile.consent_at else None,
        marketing_opt_in=profile.marketing_opt_in_at is not None,
        marketing_opt_in_at=(
            profile.marketing_opt_in_at.isoformat() if profile.marketing_opt_in_at else None
        ),
    )


@router.patch("/me", response_model=ProfileViewResponse)
def patch_my_profile(
    body: ProfileUpdateRequest,
    current: AuthUser,
    db: DbSession,
) -> ProfileViewResponse:
    if (
        body.full_name is None
        and body.phone is None
        and body.email is None
        and body.marketing_opt_in is None
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )
    pii = PiiService(db)
    try:
        profile = pii.update_profile(
            current.id,
            actor_user_id=current.id,
            full_name=body.full_name,
            phone=body.phone,
            email=str(body.email) if body.email is not None else None,
            marketing_opt_in=body.marketing_opt_in,
        )
        db.commit()
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found") from exc
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already in use",
        ) from exc
    return ProfileViewResponse(
        user_id=str(profile.user_id),
        email=profile.email,
        full_name=profile.full_name,
        phone=profile.phone,
        consent_at=profile.consent_at.isoformat() if profile.consent_at else None,
        marketing_opt_in=profile.marketing_opt_in_at is not None,
        marketing_opt_in_at=(
            profile.marketing_opt_in_at.isoformat() if profile.marketing_opt_in_at else None
        ),
    )


@router.get("/me/export", response_model=ProfileExportResponse)
def export_my_profile(current: AuthUser, db: DbSession) -> ProfileExportResponse:
    pii = PiiService(db)
    try:
        data = pii.export_subject(current.id, actor_user_id=current.id)
        db.commit()
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found") from exc
    return ProfileExportResponse(**data)


@router.post("/me/erase", status_code=status.HTTP_200_OK)
def erase_my_profile(current: AuthUser, db: DbSession) -> dict:
    """Право на забвение: обезличить ПДн и деактивировать учётку."""
    pii = PiiService(db)
    try:
        pii.erase_subject(current.id, actor_user_id=current.id)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found") from exc

    user = db.get(User, current.id)
    if user is not None:
        user.is_active = False
    db.commit()
    return {"ok": True, "erased": True}
