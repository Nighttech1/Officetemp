"""Marketing opt-in, unsubscribe, campaigns — W-64."""

from __future__ import annotations

from app.models.pii import UserProfile


def _auth(client, payload):
    reg = client.post("/api/v1/auth/register", json={**payload, "consent": True})
    assert reg.status_code == 201
    return {"Authorization": f"Bearer {reg.json()['access_token']}"}


def test_register_marketing_opt_in_and_campaign_dry_run(client, register_payload):
    payload = {
        **register_payload,
        "consent": True,
        "marketing_opt_in": True,
        "email": "mkt@example.com",
    }
    headers = _auth(client, payload)

    me = client.get("/api/v1/profile/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["marketing_opt_in"] is True

    # User without opt-in should not be targeted
    other = {
        **register_payload,
        "consent": True,
        "marketing_opt_in": False,
        "email": "nomkt@example.com",
        "org_name": "Other Co",
    }
    client.post("/api/v1/auth/register", json=other)

    camp = client.post(
        "/api/v1/marketing/campaigns",
        headers=headers,
        json={
            "subject": "Spring offer",
            "html_body": "<h1>Banner</h1><p>Deal</p>",
            "text_body": "Deal",
        },
    )
    assert camp.status_code == 201
    body = camp.json()
    assert body["status"] in ("queued", "sending", "sent")
    # Eager celery → processed
    detail = client.get(f"/api/v1/marketing/campaigns/{body['id']}", headers=headers)
    assert detail.status_code == 200
    stats = detail.json().get("stats") or {}
    assert stats.get("recipients") == 1
    assert (stats.get("dry_run") or 0) + (stats.get("sent") or 0) == 1


def test_opt_out_and_unsubscribe_token(client, register_payload, db):
    payload = {
        **register_payload,
        "consent": True,
        "marketing_opt_in": True,
        "email": "unsub@example.com",
    }
    headers = _auth(client, payload)

    # Read token hash from DB and forge raw via rotate isn't available —
    # opt-in again via patch after we pull hash: use ensure by creating campaign first
    # Simpler: set opt-out via patch
    off = client.patch(
        "/api/v1/profile/me",
        headers=headers,
        json={"marketing_opt_in": False},
    )
    assert off.status_code == 200
    assert off.json()["marketing_opt_in"] is False

    # Re-enable to get a token in DB, then unsubscribe via API using known raw from service
    from app.db.session import SessionLocal
    from app.services.pii_service import PiiService

    on = client.patch(
        "/api/v1/profile/me",
        headers=headers,
        json={"marketing_opt_in": True},
    )
    assert on.json()["marketing_opt_in"] is True

    session = SessionLocal()
    try:
        pii = PiiService(session)
        profile = session.query(UserProfile).filter_by(email="unsub@example.com").one()
        raw = pii.ensure_unsub_raw_token(profile)
        session.commit()
    finally:
        session.close()

    res = client.post("/api/v1/marketing/unsubscribe", json={"token": raw})
    assert res.status_code == 200
    assert res.json()["unsubscribed"] is True

    me = client.get("/api/v1/profile/me", headers=headers)
    assert me.json()["marketing_opt_in"] is False


def test_campaign_skips_without_opt_in(client, register_payload):
    headers = _auth(
        client,
        {**register_payload, "email": "skip@example.com", "marketing_opt_in": False},
    )
    camp = client.post(
        "/api/v1/marketing/campaigns",
        headers=headers,
        json={"subject": "X", "html_body": "<p>y</p>"},
    )
    assert camp.status_code == 201
    detail = client.get(
        f"/api/v1/marketing/campaigns/{camp.json()['id']}", headers=headers
    )
    stats = detail.json().get("stats") or {}
    assert stats.get("recipients") == 0
