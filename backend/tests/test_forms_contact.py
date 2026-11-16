"""C-22 contact form — honeypot, validation, happy path."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.core.config import get_settings
from app.services import forms_mail


@pytest.fixture()
def forms_tmpdir(tmp_path, monkeypatch):
    monkeypatch.setenv("FORMS_RUNTIME_DIR", str(tmp_path))
    monkeypatch.setenv("SMTP_HOST", "")
    get_settings.cache_clear()
    # Reset in-memory rate limiter between tests
    forms_mail._rate_buckets.clear()
    yield tmp_path
    get_settings.cache_clear()


def test_contact_honeypot_silent_ok(client, forms_tmpdir):
    res = client.post(
        "/api/v1/forms/contact",
        json={
            "name": "Bot",
            "email": "bot@example.com",
            "message": "Buy now buy now buy now",
            "website": "https://spam.example",
        },
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["ok"] is True
    assert body["status"] == "accepted"
    jsonl = forms_tmpdir / "submissions.jsonl"
    assert not jsonl.exists() or jsonl.read_text(encoding="utf-8").strip() == ""


def test_contact_happy_path_stored(client, forms_tmpdir):
    res = client.post(
        "/api/v1/forms/contact",
        json={
            "name": "Иван",
            "email": "ivan@example.com",
            "message": "Нужна помощь с шаблонами",
            "website": "",
        },
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["ok"] is True
    assert body["status"] == "stored"

    jsonl = forms_tmpdir / "submissions.jsonl"
    assert jsonl.is_file()
    lines = [ln for ln in jsonl.read_text(encoding="utf-8").splitlines() if ln.strip()]
    assert len(lines) == 1
    row = json.loads(lines[0])
    assert row["email"] == "ivan@example.com"
    assert row["name"] == "Иван"
    assert row["status"] == "stored"


def test_contact_validation_rejects_short_message(client, forms_tmpdir):
    res = client.post(
        "/api/v1/forms/contact",
        json={
            "name": "A",
            "email": "a@example.com",
            "message": "hi",
            "website": "",
        },
    )
    assert res.status_code == 422


def test_contact_validation_rejects_bad_email(client, forms_tmpdir):
    res = client.post(
        "/api/v1/forms/contact",
        json={
            "name": "A",
            "email": "not-an-email",
            "message": "Достаточно длинное сообщение",
            "website": "",
        },
    )
    assert res.status_code == 422
