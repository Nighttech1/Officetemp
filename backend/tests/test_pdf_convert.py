"""PDF conversion tests — dxpdf in-process (no LibreOffice / Docker)."""

from __future__ import annotations

from pathlib import Path
from unittest.mock import patch

import pytest

from app.services.doc_engine.pdf_convert import (
    PdfConversionUnavailable,
    convert_docx_to_pdf,
)

FIXTURES = Path(__file__).resolve().parent / "fixtures" / "docx"
FLAT = FIXTURES / "flat_tags.docx"


def test_convert_real_fixture_with_dxpdf():
    assert FLAT.is_file()
    pdf = convert_docx_to_pdf(FLAT.read_bytes())
    assert pdf.startswith(b"%PDF")
    assert len(pdf) > 500


def test_convert_missing_dxpdf(monkeypatch):
    import builtins

    real_import = builtins.__import__

    def fake_import(name, *args, **kwargs):
        if name == "dxpdf" or name.startswith("dxpdf."):
            raise ImportError("simulated missing dxpdf")
        return real_import(name, *args, **kwargs)

    monkeypatch.setattr(builtins, "__import__", fake_import)
    with pytest.raises(PdfConversionUnavailable, match="dxpdf"):
        convert_docx_to_pdf(b"PK\x03\x04-fake")


def test_convert_engine_error():
    with patch("dxpdf.convert", side_effect=RuntimeError("boom")):
        with pytest.raises(PdfConversionUnavailable, match="dxpdf conversion failed"):
            convert_docx_to_pdf(b"PK\x03\x04-fake")
