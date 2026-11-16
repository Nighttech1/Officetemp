"""Auth: register, login, me, forgot/reset password."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, HTTPException, Request, status
from sqlalchemy.exc import IntegrityError

from app.api.deps import AuthUser, DbSession
from app.core.config import get_settings
from app.core.rbac import Role
from app.core.security import create_access_token, hash_password, verify_password
from app.models.organization import Organization
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    MeResponse,
    RegisterRequest,
    ResetPasswordRequest,
    ResetPasswordResponse,
    TokenResponse,
)
from app.services import password_reset_service
from app.services.pii_service import PiiService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: DbSession) -> TokenResponse:
    if not body.consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Consent to personal data processing is required (152-FZ)",
        )

    pii = PiiService(db)
    existing = pii.get_profile_by_email(body.email)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    org = Organization(id=uuid.uuid4(), name=body.org_name.strip())
    user = User(
        id=uuid.uuid4(),
        organization_id=org.id,
        role=Role.owner.value,
        password_hash=hash_password(body.password),
        is_active=True,
    )
    db.add(org)
    db.add(user)
    db.flush()

    pii.create_profile(
        user_id=user.id,
        email=str(body.email),
        full_name=body.full_name,
        actor_user_id=user.id,
        consent=True,
        marketing_opt_in=bool(body.marketing_opt_in),
    )
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Could not register (conflict)",
        ) from exc

    token = create_access_token(
        subject=str(user.id),
        org_id=str(org.id),
        role=user.role,
    )
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: DbSession) -> TokenResponse:
    pii = PiiService(db)
    profile = pii.get_profile_by_email(str(body.email))
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    user = db.get(User, profile.user_id)
    if user is None or not user.is_active:
        db.commit()  # keep PII access audit even on failed auth
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    if not verify_password(body.password, user.password_hash):
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    db.commit()
    token = create_access_token(
        subject=str(user.id),
        org_id=str(user.organization_id),
        role=user.role,
    )
    return TokenResponse(access_token=token)


@router.get("/me", response_model=MeResponse)
def me(current: AuthUser, db: DbSession) -> MeResponse:
    user = db.get(User, current.id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    pii = PiiService(db)
    profile = pii.get_profile_by_user_id(user.id, actor_user_id=current.id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    db.commit()

    return MeResponse(
        id=str(user.id),
        organization_id=str(user.organization_id),
        role=user.role,
        email=profile.email,
        full_name=profile.full_name,
        phone=profile.phone,
        consent_at=profile.consent_at.isoformat() if profile.consent_at else None,
        is_active=user.is_active,
    )


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(
    body: ForgotPasswordRequest,
    request: Request,
    db: DbSession,
) -> ForgotPasswordResponse:
    settings = get_settings()
    client_ip = request.client.host if request.client else "unknown"
    if not password_reset_service.check_forgot_rate_limit(client_ip, settings):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many reset requests. Try again later.",
        )
    result = password_reset_service.request_password_reset(
        db, str(body.email), settings=settings
    )
    db.commit()
    return ForgotPasswordResponse(
        ok=True,
        detail=result.get(
            "detail",
            "If the account exists, reset instructions were sent.",
        ),
        debug_reset_url=result.get("debug_reset_url"),
    )


@router.post("/reset-password", response_model=ResetPasswordResponse)
def reset_password(body: ResetPasswordRequest, db: DbSession) -> ResetPasswordResponse:
    try:
        password_reset_service.reset_password_with_token(
            db,
            raw_token=body.token,
            new_password=body.new_password,
        )
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be 8–128 characters",
        ) from exc
    except LookupError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset link",
        ) from exc
    return ResetPasswordResponse()
