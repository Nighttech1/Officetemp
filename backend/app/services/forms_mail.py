"""Contact form storage + optional SMTP mail (C-22)."""

from __future__ import annotations

import json
import logging
import smtplib
import threading
import time
import uuid
from collections import defaultdict, deque
from datetime import datetime, timezone
from email.message import EmailMessage
from pathlib import Path

from app.core.config import Settings

logger = logging.getLogger(__name__)

_rate_lock = threading.Lock()
_rate_buckets: dict[str, deque[float]] = defaultdict(deque)


def forms_dir(settings: Settings) -> Path:
    raw = (settings.forms_runtime_dir or "").strip()
    if raw:
        path = Path(raw)
    else:
        path = Path(__file__).resolve().parents[2] / ".runtime" / "forms"
    path.mkdir(parents=True, exist_ok=True)
    return path


def check_rate_limit(ip: str, settings: Settings) -> bool:
    """Return True if request is allowed; False if over limit."""
    limit = max(1, int(settings.forms_rate_limit_per_minute or 5))
    now = time.monotonic()
    window = 60.0
    key = ip or "unknown"
    with _rate_lock:
        bucket = _rate_buckets[key]
        while bucket and now - bucket[0] > window:
            bucket.popleft()
        if len(bucket) >= limit:
            return False
        bucket.append(now)
        return True


def store_submission(
    *,
    settings: Settings,
    name: str,
    email: str,
    message: str,
    ip: str,
    status: str,
) -> dict:
    record = {
        "id": str(uuid.uuid4()),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "name": name,
        "email": email,
        "message": message,
        "ip": ip,
        "status": status,
    }
    target = forms_dir(settings) / "submissions.jsonl"
    with target.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(record, ensure_ascii=False) + "\n")
    return record


def smtp_configured(settings: Settings) -> bool:
    return bool((settings.smtp_host or "").strip())


def send_contact_email(
    *,
    settings: Settings,
    name: str,
    email: str,
    message: str,
) -> bool:
    """Send email if SMTP configured. Returns True on success."""
    if not smtp_configured(settings):
        return False
    to_addr = (settings.smtp_to or settings.smtp_from or "").strip()
    if not to_addr:
        logger.warning("SMTP configured but SMTP_TO/SMTP_FROM empty")
        return False

    msg = EmailMessage()
    msg["Subject"] = f"[DocSaaS] Contact from {name}"
    msg["From"] = settings.smtp_from
    msg["To"] = to_addr
    msg["Reply-To"] = email
    msg.set_content(
        f"Name: {name}\nEmail: {email}\n\n{message}\n",
        charset="utf-8",
    )

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
            if settings.smtp_use_tls:
                smtp.starttls()
            user = (settings.smtp_user or "").strip()
            if user:
                smtp.login(user, settings.smtp_password or "")
            smtp.send_message(msg)
        return True
    except Exception:
        logger.exception("Failed to send contact email")
        return False


def send_plain_email(
    *,
    settings: Settings,
    to_addr: str,
    subject: str,
    body: str,
) -> bool:
    """Send a simple text email to a recipient (password reset, etc.)."""
    if not smtp_configured(settings):
        return False
    dest = (to_addr or "").strip()
    if not dest:
        return False
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from or "noreply@docsaas.local"
    msg["To"] = dest
    msg.set_content(body, charset="utf-8")
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
            if settings.smtp_use_tls:
                smtp.starttls()
            user = (settings.smtp_user or "").strip()
            if user:
                smtp.login(user, settings.smtp_password or "")
            smtp.send_message(msg)
        return True
    except Exception:
        logger.exception("Failed to send email to recipient")
        return False


def send_html_email(
    *,
    settings: Settings,
    to_addr: str,
    subject: str,
    html_body: str,
    text_body: str | None = None,
) -> bool:
    """Send HTML email (marketing banners) with optional plain-text fallback."""
    if not smtp_configured(settings):
        return False
    dest = (to_addr or "").strip()
    if not dest:
        return False
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from or "noreply@docsaas.local"
    msg["To"] = dest
    plain = (text_body or "").strip() or "Откройте письмо в HTML-клиенте. Отписаться: см. ссылку в письме."
    msg.set_content(plain, charset="utf-8")
    msg.add_alternative(html_body, subtype="html", charset="utf-8")
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=30) as smtp:
            if settings.smtp_use_tls:
                smtp.starttls()
            user = (settings.smtp_user or "").strip()
            if user:
                smtp.login(user, settings.smtp_password or "")
            smtp.send_message(msg)
        return True
    except Exception:
        logger.exception("Failed to send HTML email")
        return False
