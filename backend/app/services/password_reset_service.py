"""Password reset: create one-time tokens, email link, apply new password."""

from __future__ import annotations

import hashlib
import logging
import secrets
import threading
import time
import uuid
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.security import hash_password
from app.models.password_reset import PasswordResetToken
from app.models.pii import UserProfile
from app.models.user import User
from app.services.forms_mail import send_plain_email, smtp_configured
from app.services.pii_service import PiiService

logger = logging.getLogger(__name__)

_rate_lock = threading.Lock()
_rate_buckets: dict[str, deque[float]] = defaultdict(deque)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def check_forgot_rate_limit(ip: str, settings: Settings) -> bool:
    """Return True if allowed; False if over hourly limit."""
    limit = max(1, int(settings.password_reset_rate_per_hour or 5))
    now = time.monotonic()
    window = 3600.0
    key = ip or "unknown"
    with _rate_lock:
        bucket = _rate_buckets[key]
        while bucket and now - bucket[0] > window:
            bucket.popleft()
        if len(bucket) >= limit:
            return False
        bucket.append(now)
        return True


def hash_reset_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def build_reset_url(settings: Settings, raw_token: str) -> str:
    base = (settings.public_app_url or "http://127.0.0.1:3000").rstrip("/")
    return f"{base}/reset-password?token={raw_token}"


def request_password_reset(db: Session, email: str, *, settings: Settings | None = None) -> dict:
    """
    Always behaves the same from caller's view (no email enumeration).
    Returns {ok: True, ...}; may include debug_reset_url when debug=True and no SMTP.
    """
    settings = settings or get_settings()
    normalized = email.lower().strip()
    pii = PiiService(db)

    profile = (
        db.query(UserProfile)
        .filter(UserProfile.email == normalized)
        .one_or_none()
    )

    out: dict = {"ok": True, "detail": "If the account exists, reset instructions were sent."}

    if profile is None:
        return out

    user = db.get(User, profile.user_id)
    if user is None or not user.is_active:
        return out

    # Invalidate previous unused tokens for this user
    db.execute(
        delete(PasswordResetToken).where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used_at.is_(None),
        )
    )

    raw = secrets.token_urlsafe(32)
    ttl = max(5, int(settings.password_reset_ttl_minutes or 60))
    row = PasswordResetToken(
        id=uuid.uuid4(),
        user_id=user.id,
        token_hash=hash_reset_token(raw),
        expires_at=_utcnow() + timedelta(minutes=ttl),
    )
    db.add(row)
    pii._audit(  # noqa: SLF001 — intentional internal audit
        actor_user_id=user.id,
        subject_user_id=user.id,
        action="password.reset_request",
    )
    db.flush()

    link = build_reset_url(settings, raw)
    subject = "DocSaaS — восстановление пароля"
    body = (
        "Здравствуйте!\n\n"
        "Мы получили запрос на сброс пароля для вашего кабинета DocSaaS.\n"
        f"Перейдите по ссылке (действует {ttl} мин.):\n\n{link}\n\n"
        "Если вы не запрашивали сброс — просто проигнорируйте это письмо.\n"
    )

    mailed = False
    if smtp_configured(settings):
        mailed = send_plain_email(
            settings=settings,
            to_addr=profile.email,
            subject=subject,
            body=body,
        )
    if not mailed:
        # Dev / no SMTP: never email plaintext password; log link for operators
        logger.warning(
            "password_reset_link_no_smtp user_id=%s (open reset URL from logs in non-prod)",
            user.id,
        )
        logger.info("password_reset_url=%s", link)
        if settings.debug:
            out["debug_reset_url"] = link

    return out


def reset_password_with_token(
    db: Session,
    *,
    raw_token: str,
    new_password: str,
    settings: Settings | None = None,
) -> None:
    settings = settings or get_settings()
    if len(new_password) < 8 or len(new_password) > 128:
        raise ValueError("password_length")

    token_hash = hash_reset_token(raw_token.strip())
    row = db.scalar(
        select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash)
    )
    if row is None or row.used_at is not None:
        raise LookupError("invalid_token")
    exp = row.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < _utcnow():
        raise LookupError("expired_token")

    user = db.get(User, row.user_id)
    if user is None or not user.is_active:
        raise LookupError("invalid_token")

    user.password_hash = hash_password(new_password)
    row.used_at = _utcnow()
    # Burn other open tokens
    db.execute(
        delete(PasswordResetToken).where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used_at.is_(None),
            PasswordResetToken.id != row.id,
        )
    )
    PiiService(db)._audit(  # noqa: SLF001
        actor_user_id=user.id,
        subject_user_id=user.id,
        action="password.reset_complete",
    )
