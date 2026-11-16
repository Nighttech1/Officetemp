"""Doc Engine — DOCX render via docxtpl and PDF via dxpdf (offline OSS)."""

from app.services.doc_engine.pdf_convert import (
    LibreOfficeUnavailable,
    PdfConversionUnavailable,
    convert_docx_to_pdf,
)
from app.services.doc_engine.render import render_docx

__all__ = [
    "render_docx",
    "convert_docx_to_pdf",
    "PdfConversionUnavailable",
    "LibreOfficeUnavailable",
]
