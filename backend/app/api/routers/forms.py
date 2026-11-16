"""Public contact form endpoints (C-22)."""

from fastapi import APIRouter, HTTPException, Request, status

from app.core.config import get_settings
from app.schemas.forms import ContactIn, ContactOut
from app.services import forms_mail

router = APIRouter(prefix="/forms", tags=["forms"])


@router.post("/contact", response_model=ContactOut)
def contact_submit(payload: ContactIn, request: Request) -> ContactOut:
    settings = get_settings()

    # Honeypot: pretend success so bots do not adapt.
    if (payload.website or "").strip():
        return ContactOut(ok=True, status="accepted")

    client_ip = request.client.host if request.client else "unknown"
    if not forms_mail.check_rate_limit(client_ip, settings):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Слишком много запросов. Подождите минуту.",
        )

    emailed = forms_mail.send_contact_email(
        settings=settings,
        name=payload.name.strip(),
        email=str(payload.email).strip(),
        message=payload.message.strip(),
    )
    status_label = "emailed" if emailed else "stored"
    forms_mail.store_submission(
        settings=settings,
        name=payload.name.strip(),
        email=str(payload.email).strip(),
        message=payload.message.strip(),
        ip=client_ip,
        status=status_label,
    )
    return ContactOut(ok=True, status=status_label)
