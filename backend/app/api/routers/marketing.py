"""Marketing campaigns API — opt-in broadcasts (banners / offers)."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import AuthUser, DbSession
from app.core.config import get_settings
from app.core.rbac import Role, require_roles
from app.schemas.marketing import (
    CampaignCreateRequest,
    CampaignResponse,
    UnsubscribeRequest,
    UnsubscribeResponse,
)
from app.services import marketing_service
from app.services.pii_service import PiiService

router = APIRouter(prefix="/marketing", tags=["marketing"])


@router.post("/unsubscribe", response_model=UnsubscribeResponse)
def unsubscribe(body: UnsubscribeRequest, db: DbSession) -> UnsubscribeResponse:
    pii = PiiService(db)
    ok = pii.unsubscribe_by_token(body.token)
    db.commit()
    # Always same message — no token probing
    return UnsubscribeResponse(
        ok=True,
        detail="If the link was valid, you are unsubscribed from marketing emails.",
        unsubscribed=ok,
    )


@router.post("/campaigns", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
def create_campaign(
    body: CampaignCreateRequest,
    db: DbSession,
    current: Annotated[AuthUser, Depends(require_roles(Role.owner))],
) -> CampaignResponse:
    settings = get_settings()
    try:
        campaign = marketing_service.create_and_queue_campaign(
            db,
            subject=body.subject,
            html_body=body.html_body,
            text_body=body.text_body,
            created_by=current.id,
            settings=settings,
        )
        db.commit()
    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Marketing campaigns are disabled",
        ) from exc

    # Queue async send (eager in tests)
    from app.worker.tasks import send_marketing_campaign

    send_marketing_campaign.delay(str(campaign.id))
    db.expire_all()
    fresh = marketing_service.get_campaign(db, campaign.id) or campaign
    return _campaign_out(fresh)


@router.get("/campaigns/{campaign_id}", response_model=CampaignResponse)
def get_campaign(
    campaign_id: uuid.UUID,
    db: DbSession,
    current: Annotated[AuthUser, Depends(require_roles(Role.owner, Role.admin))],
) -> CampaignResponse:
    campaign = marketing_service.get_campaign(db, campaign_id)
    if campaign is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    return _campaign_out(campaign)


def _campaign_out(campaign) -> CampaignResponse:
    return CampaignResponse(
        id=str(campaign.id),
        subject=campaign.subject,
        status=campaign.status,
        created_at=campaign.created_at.isoformat() if campaign.created_at else None,
        queued_at=campaign.queued_at.isoformat() if campaign.queued_at else None,
        sent_at=campaign.sent_at.isoformat() if campaign.sent_at else None,
        stats=campaign.stats_json,
    )
