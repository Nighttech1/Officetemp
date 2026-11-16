"""DOCX → PDF via dxpdf (MIT, Rust+Skia) — no LibreOffice, no cloud APIs."""

from __future__ import annotations

from pathlib import Path

RUNTIME_TMP_ROOT = Path(__file__).resolve().parents[3] / ".runtime" / "tmp"


class PdfConversionUnavailable(RuntimeError):
    """Raised when the local PDF engine cannot produce a PDF."""


# Back-compat alias for older imports/tests.
LibreOfficeUnavailable = PdfConversionUnavailable


def convert_docx_to_pdf(
    docx_bytes: bytes,
    *,
    libreoffice_bin: str | None = None,  # noqa: ARG001 — deprecated, ignored
    work_dir: str | Path | None = None,  # noqa: ARG001 — unused (in-memory)
) -> bytes:
    """
    Convert DOCX bytes to PDF using the open-source **dxpdf** engine
    (https://github.com/nerdy-pro/dxpdf) — runs fully offline in-process.
    """
    if not docx_bytes:
        raise ValueError("docx_bytes must be non-empty")

    try:
        import dxpdf
    except ImportError as exc:
        raise PdfConversionUnavailable(
            "dxpdf is not installed. Run: pip install dxpdf"
        ) from exc

    try:
        pdf_bytes = dxpdf.convert(docx_bytes)
    except Exception as exc:  # noqa: BLE001 — engine errors vary
        raise PdfConversionUnavailable(f"dxpdf conversion failed: {exc}") from exc

    if not isinstance(pdf_bytes, (bytes, bytearray)) or not bytes(pdf_bytes).startswith(
        b"%PDF"
    ):
        raise PdfConversionUnavailable("dxpdf did not return a valid PDF payload")
    return bytes(pdf_bytes)
