"""Auth-related Pydantic schemas."""

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    org_name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)
    """152-ФЗ: явное согласие на обработку ПДн. Email confirm не требуется."""
    consent: bool = False
    """Отдельное согласие на рекламные письма / баннеры / предложения."""
    marketing_opt_in: bool = False


class LoginRequest(BaseModel):
    # Login or email (temp accounts use plain login: admin1 / admin2).
    email: str = Field(min_length=1, max_length=320)
    password: str = Field(min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MeResponse(BaseModel):
    id: str
    organization_id: str
    role: str
    email: str
    full_name: str
    phone: str | None = None
    consent_at: str | None = None
    is_active: bool


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    ok: bool = True
    detail: str = "If the account exists, reset instructions were sent."
    # Only present when DEBUG=true and SMTP is not configured (local/dev).
    debug_reset_url: str | None = None


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=16, max_length=512)
    new_password: str = Field(min_length=8, max_length=128)


class ResetPasswordResponse(BaseModel):
    ok: bool = True
    detail: str = "Password updated. You can sign in."
