"""Schemas for marketing email campaigns."""

from pydantic import BaseModel, Field


class UnsubscribeRequest(BaseModel):
    token: str = Field(min_length=16, max_length=512)


class UnsubscribeResponse(BaseModel):
    ok: bool = True
    detail: str
    unsubscribed: bool = False


class CampaignCreateRequest(BaseModel):
    subject: str = Field(min_length=1, max_length=255)
    html_body: str = Field(min_length=1, max_length=200_000)
    text_body: str | None = Field(default=None, max_length=50_000)


class CampaignResponse(BaseModel):
    id: str
    subject: str
    status: str
    created_at: str | None = None
    queued_at: str | None = None
    sent_at: str | None = None
    stats: dict | None = None
