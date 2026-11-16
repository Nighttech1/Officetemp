"""Template schemas."""

from datetime import datetime

from pydantic import BaseModel, Field


class TemplateCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    storage_key: str = Field(min_length=1, max_length=512)


class TemplateOut(BaseModel):
    id: str
    organization_id: str
    name: str
    storage_key: str
    created_by: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
