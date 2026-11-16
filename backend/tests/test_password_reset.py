"""Password reset (forgot / reset) — W-63."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.core.config import get_settings
from app.models.password_reset import PasswordResetToken
from app.services.password_reset_service import hash_reset_token


def test_forgot_password_unknown_email_ok(client):
    res = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "nobody@example.com"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["ok"] is True
    assert "debug_reset_url" not in body or body.get("debug_reset_url") is None


def test_forgot_and_reset_password_flow(client, register_payload, monkeypatch):
    get_settings.cache_clear()
    monkeypatch.setenv("DEBUG", "true")
    get_settings.cache_clear()

    payload = {**register_payload, "consent": True}
    reg = client.post("/api/v1/auth/register", json=payload)
    assert reg.status_code == 201

    forgot = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": payload["email"]},
    )
    assert forgot.status_code == 200
    data = forgot.json()
    assert data["ok"] is True
    # DEBUG=true + no SMTP → debug link for tests
    url = data.get("debug_reset_url")
    assert url and "token=" in url
    token = url.split("token=", 1)[1]

    reset = client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": "newpass99"},
    )
    assert reset.status_code == 200

    # Old password fails
    bad = client.post(
        "/api/v1/auth/login",
        json={"email": payload["email"], "password": payload["password"]},
    )
    assert bad.status_code == 401

    # New password works
    good = client.post(
        "/api/v1/auth/login",
        json={"email": payload["email"], "password": "newpass99"},
    )
    assert good.status_code == 200
    assert "access_token" in good.json()

    # Token single-use
    again = client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": "another99"},
    )
    assert again.status_code == 400

    get_settings.cache_clear()


def test_reset_password_expired_token(client, register_payload, monkeypatch):
    get_settings.cache_clear()
    monkeypatch.setenv("DEBUG", "true")
    get_settings.cache_clear()

    payload = {**register_payload, "consent": True, "email": "expire@example.com"}
    reg = client.post("/api/v1/auth/register", json=payload)
    assert reg.status_code == 201

    forgot = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": payload["email"]},
    )
    assert forgot.status_code == 200
    url = forgot.json().get("debug_reset_url")
    assert url
    token = url.split("token=", 1)[1]

    # Expire the token in DB (shared in-memory engine)
    from app.db.session import SessionLocal

    session = SessionLocal()
    try:
        th = hash_reset_token(token)
        row = session.query(PasswordResetToken).filter_by(token_hash=th).one()
        row.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
        session.commit()
    finally:
        session.close()

    res = client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": "newpass99"},
    )
    assert res.status_code == 400
    get_settings.cache_clear()


def test_reset_password_invalid_token(client):
    res = client.post(
        "/api/v1/auth/reset-password",
        json={"token": "x" * 40, "new_password": "newpass99"},
    )
    assert res.status_code == 400
