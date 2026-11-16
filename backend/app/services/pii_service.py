"""PII gateway — sole access path to schema `pii` for routers."""

from __future__ import annotations

import hashlib
import logging
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.models.pii import AccessAudit, UserProfile

logger = logging.getLogger(__name__)

_ERASED_EMAIL_PREFIX = "erased+"
_ERASED_NAME = "[удалено]"


def hash_unsub_token(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


class PiiService:
    """Create/read/update/export/erase user profiles with audit writes. Never log raw PII."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def _audit(
        self,
        *,
        actor_user_id: uuid.UUID | None,
        subject_user_id: uuid.UUID,
        action: str,
    ) -> None:
        row = AccessAudit(
            id=uuid.uuid4(),
            actor_user_id=actor_user_id,
            subject_user_id=subject_user_id,
            action=action,
        )
        self.db.add(row)
        logger.info(
            "pii_audit action=%s actor=%s subject=%s",
            action,
            actor_user_id,
            subject_user_id,
        )

    def _issue_unsub_token(self, profile: UserProfile) -> str:
        raw = secrets.token_urlsafe(32)
        profile.marketing_unsub_token_hash = hash_unsub_token(raw)
        return raw

    def create_profile(
        self,
        *,
        user_id: uuid.UUID,
        email: str,
        full_name: str,
        phone: str | None = None,
        actor_user_id: uuid.UUID | None = None,
        consent: bool = True,
        marketing_opt_in: bool = False,
    ) -> UserProfile:
        now = datetime.now(timezone.utc)
        profile = UserProfile(
            user_id=user_id,
            email=email.lower().strip(),
            full_name=full_name.strip(),
            phone=phone.strip() if phone else None,
            consent_at=now if consent else None,
            marketing_opt_in_at=now if marketing_opt_in else None,
        )
        if marketing_opt_in:
            self._issue_unsub_token(profile)
        self.db.add(profile)
        self._audit(
            actor_user_id=actor_user_id or user_id,
            subject_user_id=user_id,
            action="profile.create",
        )
        if marketing_opt_in:
            self._audit(
                actor_user_id=actor_user_id or user_id,
                subject_user_id=user_id,
                action="marketing.opt_in",
            )
        self.db.flush()
        return profile

    def get_profile_by_user_id(
        self,
        user_id: uuid.UUID,
        *,
        actor_user_id: uuid.UUID | None = None,
        audit: bool = True,
    ) -> UserProfile | None:
        profile = self.db.get(UserProfile, user_id)
        if profile is not None and audit:
            self._audit(
                actor_user_id=actor_user_id or user_id,
                subject_user_id=user_id,
                action="profile.read",
            )
            self.db.flush()
        return profile

    def get_profile_by_email(
        self,
        email: str,
        *,
        actor_user_id: uuid.UUID | None = None,
    ) -> UserProfile | None:
        normalized = email.lower().strip()
        profile = (
            self.db.query(UserProfile)
            .filter(UserProfile.email == normalized)
            .one_or_none()
        )
        if profile is not None:
            self._audit(
                actor_user_id=actor_user_id or profile.user_id,
                subject_user_id=profile.user_id,
                action="profile.read_by_email",
            )
            self.db.flush()
        return profile

    def update_profile(
        self,
        user_id: uuid.UUID,
        *,
        actor_user_id: uuid.UUID,
        full_name: str | None = None,
        phone: str | None = None,
        email: str | None = None,
        marketing_opt_in: bool | None = None,
    ) -> UserProfile:
        profile = self.db.get(UserProfile, user_id)
        if profile is None:
            raise LookupError("profile not found")
        if full_name is not None:
            profile.full_name = full_name.strip()
        if phone is not None:
            profile.phone = phone.strip() or None
        if email is not None:
            profile.email = email.lower().strip()
        self._audit(
            actor_user_id=actor_user_id,
            subject_user_id=user_id,
            action="profile.update",
        )
        if marketing_opt_in is not None:
            self.set_marketing_opt_in(
                user_id,
                enabled=marketing_opt_in,
                actor_user_id=actor_user_id,
            )
            profile = self.db.get(UserProfile, user_id) or profile
        self.db.flush()
        return profile

    def set_marketing_opt_in(
        self,
        user_id: uuid.UUID,
        *,
        enabled: bool,
        actor_user_id: uuid.UUID | None = None,
    ) -> tuple[UserProfile, str | None]:
        """Enable/disable marketing. Returns (profile, raw_unsub_token if newly issued)."""
        profile = self.db.get(UserProfile, user_id)
        if profile is None:
            raise LookupError("profile not found")
        raw_token: str | None = None
        if enabled:
            if profile.marketing_opt_in_at is None:
                profile.marketing_opt_in_at = datetime.now(timezone.utc)
                raw_token = self._issue_unsub_token(profile)
                self._audit(
                    actor_user_id=actor_user_id or user_id,
                    subject_user_id=user_id,
                    action="marketing.opt_in",
                )
            elif not profile.marketing_unsub_token_hash:
                raw_token = self._issue_unsub_token(profile)
        else:
            if profile.marketing_opt_in_at is not None:
                profile.marketing_opt_in_at = None
                profile.marketing_unsub_token_hash = None
                self._audit(
                    actor_user_id=actor_user_id or user_id,
                    subject_user_id=user_id,
                    action="marketing.opt_out",
                )
        self.db.flush()
        return profile, raw_token

    def unsubscribe_by_token(self, raw_token: str) -> bool:
        """Public unsubscribe. Returns True if a matching profile existed."""
        th = hash_unsub_token(raw_token.strip())
        profile = (
            self.db.query(UserProfile)
            .filter(UserProfile.marketing_unsub_token_hash == th)
            .one_or_none()
        )
        if profile is None:
            return False
        profile.marketing_opt_in_at = None
        profile.marketing_unsub_token_hash = None
        self._audit(
            actor_user_id=None,
            subject_user_id=profile.user_id,
            action="marketing.unsub",
        )
        self.db.flush()
        return True

    def list_marketing_opted_in(self) -> list[UserProfile]:
        return (
            self.db.query(UserProfile)
            .filter(UserProfile.marketing_opt_in_at.isnot(None))
            .filter(~UserProfile.email.startswith(_ERASED_EMAIL_PREFIX))
            .all()
        )

    def ensure_unsub_raw_token(self, profile: UserProfile) -> str:
        """Issue a fresh unsubscribe token for outbound mail."""
        return self._issue_unsub_token(profile)

    def export_subject(self, user_id: uuid.UUID, *, actor_user_id: uuid.UUID) -> dict[str, Any]:
        profile = self.db.get(UserProfile, user_id)
        if profile is None:
            raise LookupError("profile not found")
        self._audit(
            actor_user_id=actor_user_id,
            subject_user_id=user_id,
            action="profile.export",
        )
        self.db.flush()
        return {
            "user_id": str(profile.user_id),
            "email": profile.email,
            "full_name": profile.full_name,
            "phone": profile.phone,
            "consent_at": profile.consent_at.isoformat() if profile.consent_at else None,
            "marketing_opt_in_at": (
                profile.marketing_opt_in_at.isoformat() if profile.marketing_opt_in_at else None
            ),
            "created_at": profile.created_at.isoformat() if profile.created_at else None,
            "exported_at": datetime.now(timezone.utc).isoformat(),
        }

    def erase_subject(self, user_id: uuid.UUID, *, actor_user_id: uuid.UUID) -> UserProfile:
        """Anonymize ПДн (право на забвение). Keeps row for FK integrity + audit trail."""
        profile = self.db.get(UserProfile, user_id)
        if profile is None:
            raise LookupError("profile not found")
        profile.email = f"{_ERASED_EMAIL_PREFIX}{user_id}@invalid.local"
        profile.full_name = _ERASED_NAME
        profile.phone = None
        profile.consent_at = None
        profile.marketing_opt_in_at = None
        profile.marketing_unsub_token_hash = None
        self._audit(
            actor_user_id=actor_user_id,
            subject_user_id=user_id,
            action="profile.erase",
        )
        self.db.flush()
        return profile

    def anonymize_stale_profiles(self, *, retention_days: int) -> int:
        """TTL cleanup: anonymize profiles older than retention_days (by created_at)."""
        if retention_days <= 0:
            return 0
        cutoff = datetime.now(timezone.utc) - timedelta(days=retention_days)
        rows = (
            self.db.query(UserProfile)
            .filter(UserProfile.created_at < cutoff)
            .filter(~UserProfile.email.startswith(_ERASED_EMAIL_PREFIX))
            .all()
        )
        count = 0
        for profile in rows:
            self.erase_subject(profile.user_id, actor_user_id=profile.user_id)
            count += 1
        return count
