"""API tests for generate/docx and templates/analyze."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import patch

from app.services.doc_engine.pdf_convert import PdfConversionUnavailable

FIXTURES = Path(__file__).resolve().parent / "fixtures" / "docx"
FLAT = FIXTURES / "flat_tags.docx"


def _auth_headers(client, register_payload):
    reg = client.post("/api/v1/auth/register", json=register_payload)
    assert reg.status_code == 201, reg.text
    token = reg.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_generate_docx_and_analyze(client, register_payload):
    assert FLAT.is_file()
    headers = _auth_headers(client, register_payload)
    context = {"ClientName": "ACME LLC", "ContractDate": "2026-09-22"}

    gen = client.post(
        "/api/v1/generate/docx",
        headers=headers,
        files={
            "template": (
                "flat_tags.docx",
                FLAT.read_bytes(),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
        data={"context": json.dumps(context)},
    )
    assert gen.status_code == 200, gen.text
    assert (
        "officedocument.wordprocessingml.document" in gen.headers.get("content-type", "")
        or gen.headers.get("content-type", "").startswith("application/")
    )
    assert b"ACME LLC" in gen.content or len(gen.content) > 1000

    analyze = client.post(
        "/api/v1/templates/analyze",
        headers=headers,
        files={
            "template": (
                "flat_tags.docx",
                FLAT.read_bytes(),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )
    assert analyze.status_code == 200, analyze.text
    body = analyze.json()
    assert "tags" in body
    names = {t["name"] for t in body["tags"]}
    assert "ClientName" in names
    assert "ContractDate" in names


def test_generate_pdf_returns_503_when_engine_unavailable(client, register_payload):
    headers = _auth_headers(client, register_payload)
    with patch(
        "app.api.routers.generate.convert_docx_to_pdf",
        side_effect=PdfConversionUnavailable("dxpdf conversion failed"),
    ):
        resp = client.post(
            "/api/v1/generate/pdf",
            headers=headers,
            files={
                "template": (
                    "flat_tags.docx",
                    FLAT.read_bytes(),
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                )
            },
            data={"context": json.dumps({"ClientName": "X", "ContractDate": "Y"})},
        )
    assert resp.status_code == 503


def test_generate_requires_auth(client):
    resp = client.post(
        "/api/v1/generate/docx",
        files={
            "template": (
                "flat_tags.docx",
                FLAT.read_bytes(),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
        data={"context": "{}"},
    )
    assert resp.status_code == 401
