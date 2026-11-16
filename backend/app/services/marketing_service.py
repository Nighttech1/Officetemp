"""Marketing email campaigns — banners / offers to opted-in users only."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.models.marketing import EmailCampaign, EmailCampaignDelivery
from app.models.user import User
from app.services.forms_mail import send_html_email, smtp_configured
from app.services.pii_service import PiiService

logger = logging.getLogger(__name__)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def build_unsub_url(settings: Settings, raw_token: str) -> str:
    base = (settings.public_app_url or "http://127.0.0.1:3000").rstrip("/")
    return f"{base}/unsubscribe?token={raw_token}"


def create_and_queue_campaign(
    db: Session,
    *,
    subject: str,
    html_body: str,
    text_body: str | None,
    created_by: uuid.UUID,
    settings: Settings | None = None,
) -> EmailCampaign:
    settings = settings or get_settings()
    if not settings.marketing_campaigns_enabled:
        raise PermissionError("marketing_disabled")

    campaign = EmailCampaign(
        id=uuid.uuid4(),
        subject=subject.strip()[:255],
        html_body=html_body,
        text_body=text_body,
        status="queued",
        created_by=created_by,
        queued_at=_utcnow(),
    )
    db.add(campaign)
    db.flush()
    return campaign


def get_campaign(db: Session, campaign_id: uuid.UUID) -> EmailCampaign | None:
    return db.get(EmailCampaign, campaign_id)


def process_campaign(db: Session, campaign_id: uuid.UUID, *, settings: Settings | None = None) -> dict:
    """Send campaign to all currently opted-in active users. Idempotent per delivery row."""
    settings = settings or get_settings()
    campaign = db.get(EmailCampaign, campaign_id)
    if campaign is None:
        raise LookupError("campaign_not_found")

    campaign.status = "sending"
    db.flush()

    pii = PiiService(db)
    recipients = pii.list_marketing_opted_in()
    sent = 0
    skipped = 0
    failed = 0
    dry_run = 0

    for profile in recipients:
        user = db.get(User, profile.user_id)
        if user is None or not user.is_active:
            skipped += 1
            continue

        existing = (
            db.query(EmailCampaignDelivery)
            .filter_by(campaign_id=campaign.id, user_id=profile.user_id)
            .one_or_none()
        )
        if existing is not None and existing.status == "sent":
            skipped += 1
            continue

        delivery = existing or EmailCampaignDelivery(
            id=uuid.uuid4(),
            campaign_id=campaign.id,
            user_id=profile.user_id,
            status="pending",
        )
        if existing is None:
            db.add(delivery)

        raw_unsub = pii.ensure_unsub_raw_token(profile)
        unsub_url = build_unsub_url(settings, raw_unsub)
        html = campaign.html_body
        if "{{unsubscribe_url}}" in html:
            html = html.replace("{{unsubscribe_url}}", unsub_url)
        else:
            html = (
                f"{html}\n<hr><p style=\"font-size:12px;color:#666\">"
                f"<a href=\"{unsub_url}\">Отписаться от рассылки</a></p>"
            )
        text = campaign.text_body or ""
        if "{{unsubscribe_url}}" in text:
            text = text.replace("{{unsubscribe_url}}", unsub_url)
        else:
            text = f"{text}\n\nОтписаться: {unsub_url}".strip()

        if smtp_configured(settings):
            ok = send_html_email(
                settings=settings,
                to_addr=profile.email,
                subject=campaign.subject,
                html_body=html,
                text_body=text,
            )
            if ok:
                delivery.status = "sent"
                delivery.sent_at = _utcnow()
                delivery.error = None
                sent += 1
            else:
                delivery.status = "failed"
                delivery.error = "smtp_send_failed"
                failed += 1
        else:
            # Dev without SMTP: count as dry-run success (no real mail)
            logger.info(
                "marketing_dry_run campaign=%s user_id=%s unsub=%s",
                campaign.id,
                profile.user_id,
                unsub_url,
            )
            delivery.status = "dry_run"
            delivery.sent_at = _utcnow()
            dry_run += 1

        db.flush()

    stats = {
        "sent": sent,
        "dry_run": dry_run,
        "failed": failed,
        "skipped": skipped,
        "recipients": len(recipients),
    }
    campaign.stats_json = stats
    campaign.status = "sent"
    campaign.sent_at = _utcnow()
    db.flush()
    return stats
