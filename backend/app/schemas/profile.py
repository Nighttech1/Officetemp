"""Pydantic schemas for ЛК profile / subject rights (152-ФЗ)."""

from pydantic import BaseModel, EmailStr, Field


class ProfileViewResponse(BaseModel):
    user_id: str
    email: str
    full_name: str
    phone: str | None = None
    consent_at: str | None = None
    marketing_opt_in: bool = False
    marketing_opt_in_at: str | None = None


class ProfileUpdateRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    phone: str | None = Field(default=None, max_length=64)
    email: EmailStr | None = None
    marketing_opt_in: bool | None = None


class ProfileExportResponse(BaseModel):
    user_id: str
    email: str
    full_name: str
    phone: str | None = None
    consent_at: str | None = None
    marketing_opt_in_at: str | None = None
    created_at: str | None = None
    exported_at: str
