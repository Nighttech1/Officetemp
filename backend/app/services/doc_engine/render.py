"""DOCX rendering via docxtpl.DocxTemplate — never rebuild from scratch."""

from __future__ import annotations

import io
import re
from pathlib import Path
from typing import Any, BinaryIO, Union
from zipfile import ZIP_DEFLATED, ZipFile

from docxtpl import DocxTemplate

from app.services.doc_engine.table_loop import ensure_table_row_loops

TemplateSource = Union[bytes, str, Path, BinaryIO]

# Jinja identifiers cannot contain spaces: {{section name}} → {{section_name}}
_SPACED_VAR_RE = re.compile(r"\{\{\s*([^}]+?)\s*\}\}")


def _normalize_spaced_jinja_tags(docx_bytes: bytes) -> bytes:
    """Rewrite ``{{a b}}`` → ``{{a_b}}`` inside word/*.xml parts.

    Never touch matches that span Word runs (contain ``<`` / ``>``): replacing
    spaces there turns ``<w:r w:rsidR=…>`` into invalid ``<w:r_w:rsidR=…>``.
    """

    def repl(match: re.Match[str]) -> str:
        expr = match.group(1).strip()
        # Split-run Jinja: {{</w:t></w:r><w:r …><w:t>tag}} — leave untouched.
        if "<" in expr or ">" in expr:
            return match.group(0)
        if " " not in expr and "\t" not in expr:
            return match.group(0)
        # keep filters: "section name|default('')" → "section_name|default('')"
        if "|" in expr:
            head, rest = expr.split("|", 1)
            head = "_".join(head.split())
            return "{{" + head + "|" + rest + "}}"
        return "{{" + "_".join(expr.split()) + "}}"

    out = io.BytesIO()
    with ZipFile(io.BytesIO(docx_bytes), "r") as zin, ZipFile(
        out, "w", compression=ZIP_DEFLATED
    ) as zout:
        for info in zin.infolist():
            data = zin.read(info.filename)
            if info.filename.startswith("word/") and info.filename.endswith(".xml"):
                text = data.decode("utf-8")
                text2 = _SPACED_VAR_RE.sub(repl, text)
                data = text2.encode("utf-8")
            zout.writestr(info, data)
    return out.getvalue()


def _normalize_context_keys(context: dict[str, Any]) -> dict[str, Any]:
    """Duplicate keys with spaces as underscore variants for Jinja."""
    out = dict(context)
    for key, value in list(context.items()):
        if isinstance(key, str) and (" " in key or "\t" in key):
            out["_".join(key.split())] = value
        if isinstance(value, list):
            new_list = []
            for item in value:
                if isinstance(item, dict):
                    new_list.append(_normalize_context_keys(item))
                else:
                    new_list.append(item)
            out[key] = new_list
            if isinstance(key, str) and (" " in key or "\t" in key):
                out["_".join(key.split())] = new_list
    return out


_JC_CENTER = '<w:jc w:val="center"/>'
_PPR_RE = re.compile(r"<w:pPr(?:\s[^>]*)?>.*?</w:pPr>", re.DOTALL)
_JC_RE = re.compile(r"<w:jc\s[^/]*/>")


def _center_table_cell_paragraphs(xml: str) -> str:
    """Force ``w:jc=center`` on paragraphs that live inside ``w:tc``."""

    def _center_one_para(pm: re.Match[str]) -> str:
        open_t, body, close_t = pm.group(1), pm.group(2), pm.group(3)
        if _PPR_RE.search(body):
            body2 = _PPR_RE.sub(
                lambda m: (
                    _JC_RE.sub(_JC_CENTER, m.group(0))
                    if _JC_RE.search(m.group(0))
                    else re.sub(
                        r"(<w:pPr(?:\s[^>]*)?>)",
                        r"\1" + _JC_CENTER,
                        m.group(0),
                        count=1,
                    )
                ),
                body,
                count=1,
            )
            return open_t + body2 + close_t
        return open_t + f"<w:pPr>{_JC_CENTER}</w:pPr>" + body + close_t

    def fix_tc(match: re.Match[str]) -> str:
        block = match.group(0)
        return re.sub(
            r"(<w:p(?:\s[^>]*)?>)(.*?)(</w:p>)",
            _center_one_para,
            block,
            flags=re.DOTALL,
        )

    return re.sub(
        r"<w:tc(?:\s[^>]*)?>.*?</w:tc>",
        fix_tc,
        xml,
        flags=re.DOTALL,
    )


def _center_table_cells_in_docx(docx_bytes: bytes) -> bytes:
    out = io.BytesIO()
    with ZipFile(io.BytesIO(docx_bytes), "r") as zin, ZipFile(
        out, "w", compression=ZIP_DEFLATED
    ) as zout:
        for info in zin.infolist():
            data = zin.read(info.filename)
            if info.filename.startswith("word/") and info.filename.endswith(
                ".xml"
            ):
                try:
                    text = data.decode("utf-8")
                    text2 = _center_table_cell_paragraphs(text)
                    data = text2.encode("utf-8")
                except Exception:  # noqa: BLE001
                    pass
            zout.writestr(info, data)
    return out.getvalue()


def render_docx(template_bytes_or_path: TemplateSource, context: dict[str, Any]) -> bytes:
    """
    Fill a .docx template with ``context`` using docxtpl only.

    Accepts raw bytes, a filesystem path, or a binary file-like object.
    Returns the rendered document as bytes.
    """
    if context is None:
        context = {}
    if not isinstance(context, dict):
        raise TypeError("context must be a dict")

    raw_bytes: bytes | None = None
    if isinstance(template_bytes_or_path, (bytes, bytearray)):
        raw_bytes = bytes(template_bytes_or_path)
    elif isinstance(template_bytes_or_path, (str, Path)):
        raw_bytes = Path(template_bytes_or_path).read_bytes()
    elif hasattr(template_bytes_or_path, "read"):
        raw_bytes = template_bytes_or_path.read()
        if isinstance(raw_bytes, str):
            raw_bytes = raw_bytes.encode("utf-8")
    else:
        raise TypeError(
            "template_bytes_or_path must be bytes, path, or a binary file-like object"
        )

    # Multi-row Excel range → expand static table body with {%tr for item in items %}
    prepared = ensure_table_row_loops(raw_bytes, context)
    prepared = _normalize_spaced_jinja_tags(prepared)
    context = _normalize_context_keys(context)
    source: BinaryIO = io.BytesIO(prepared)

    try:
        tpl = DocxTemplate(source)
        tpl.render(context)
        out = io.BytesIO()
        tpl.save(out)
        rendered = out.getvalue()
        try:
            return _center_table_cells_in_docx(rendered)
        except Exception:  # noqa: BLE001
            return rendered
    finally:
        source.close()
