"""Temporary local accounts for demo login (not for production).

Logins: admin1 / admin1, admin2 / admin2
"""

from __future__ import annotations

import logging
import uuid

from sqlalchemy.orm import Session

from app.core.rbac import Role
from app.core.security import hash_password
from app.models.organization import Organization
from app.models.user import User
from app.services.pii_service import PiiService

logger = logging.getLogger(__name__)

TEMP_ACCOUNTS: tuple[tuple[str, str, str, str], ...] = (
    ("admin1", "admin1", "Temp Org Admin1", "Admin One"),
    ("admin2", "admin2", "Temp Org Admin2", "Admin Two"),
)


def ensure_temp_accounts(db: Session | None = None) -> None:
    """Create demo users if missing. Idempotent."""
    own = db is None
    if db is None:
        # Resolve SessionLocal at call time so test fixtures can rebind the engine.
        from app.db import session as db_session

        session = db_session.SessionLocal()
    else:
        session = db
    try:
        pii = PiiService(session)
        for login, password, org_name, full_name in TEMP_ACCOUNTS:
            email = login.lower().strip()
            if pii.get_profile_by_email(email) is not None:
                continue
            org = Organization(id=uuid.uuid4(), name=org_name)
            user = User(
                id=uuid.uuid4(),
                organization_id=org.id,
                role=Role.owner.value,
                password_hash=hash_password(password),
                is_active=True,
            )
            session.add(org)
            session.add(user)
            session.flush()
            pii.create_profile(
                user_id=user.id,
                email=email,
                full_name=full_name,
                actor_user_id=user.id,
            )
            logger.info("Seeded temp account login=%s", login)
        session.commit()
    except Exception:
        session.rollback()
        logger.exception("Failed to seed temp accounts")
        raise
    finally:
        if own:
            session.close()


def seed_temp_accounts_on_startup() -> None:
    try:
        ensure_temp_accounts()
    except Exception:
        # Do not block API boot in empty/test DBs; logs already emitted.
        logger.warning("Temp account seed skipped due to error")
