"""Contact form request/response schemas."""

from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class ContactIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    message: str = Field(min_length=5, max_length=5000)
    # Honeypot — bots fill this; humans leave empty.
    website: str = ""


class ContactOut(BaseModel):
    ok: bool = True
    status: Literal["stored", "emailed", "accepted"] = "stored"
