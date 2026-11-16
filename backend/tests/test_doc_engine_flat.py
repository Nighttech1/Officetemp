"""Unit tests for flat docxtpl tag rendering."""

from __future__ import annotations

from io import BytesIO
from pathlib import Path

from docx import Document

from app.services.doc_engine import render_docx

FIXTURES = Path(__file__).resolve().parent / "fixtures" / "docx"
FLAT = FIXTURES / "flat_tags.docx"


def test_render_replaces_client_name():
    assert FLAT.is_file(), "run tests/fixtures/docx/build_fixtures.py"
    rendered = render_docx(
        FLAT.read_bytes(),
        {"ClientName": "ACME LLC", "ContractDate": "2026-09-22"},
    )
    doc = Document(BytesIO(rendered))
    text = "\n".join(p.text for p in doc.paragraphs)
    assert "ACME LLC" in text
    assert "{{ ClientName }}" not in text
    assert "2026-09-22" in text
    assert "{{ ContractDate }}" not in text
