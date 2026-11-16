"""PII schema models — personal data isolated from public business tables."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import Uuid

from app.core.config import get_settings
from app.db.base import Base


def _pii_table_args(*extra) -> tuple:
    schema = get_settings().effective_pii_schema
    args = list(extra)
    if schema:
        args.append({"schema": schema})
    return tuple(args)


class UserProfile(Base):
    """Personal data for a user. Never join into template queries."""

    __tablename__ = "user_profiles"
    __table_args__ = _pii_table_args(
        Index("ix_user_profiles_email", "email", unique=True),
        Index("ix_user_profiles_marketing_unsub_token_hash", "marketing_unsub_token_hash", unique=True),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
    )
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    consent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    # Separate from 152-FZ processing consent — advertising / offers only.
    marketing_opt_in_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    marketing_unsub_token_hash: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class AccessAudit(Base):
    """Audit trail for every PII profile read/write. Do not store raw PII here."""

    __tablename__ = "access_audit"
    __table_args__ = _pii_table_args()

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        nullable=True,
    )
    subject_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        nullable=False,
    )
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
