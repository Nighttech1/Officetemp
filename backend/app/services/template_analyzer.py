"""Extract Jinja/docxtpl tags from a .docx template (read-only OOXML parse)."""

from __future__ import annotations

import io
import re
import zipfile
from collections import OrderedDict
from typing import Any, BinaryIO, Union
from xml.etree import ElementTree as ET

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NS = {"w": W_NS}

# Match {{ ... }} and {% ... %} including multiline content inside a glued paragraph.
TAG_RE = re.compile(r"(\{\{.*?\}\}|\{%.*?%\})", re.DOTALL)

TemplateSource = Union[bytes, str, BinaryIO]


def analyze_template(template_bytes_or_path: TemplateSource) -> list[dict[str, Any]]:
    """
    Return deduplicated tag descriptors:

        { "name": str, "kind": "var"|"tr_for"|"for"|"if"|"other", "raw": str, "count": int }
    """
    data = _read_bytes(template_bytes_or_path)
    texts = _extract_paragraph_texts(data)
    raw_tags: list[str] = []
    for text in texts:
        raw_tags.extend(TAG_RE.findall(text))

    buckets: OrderedDict[str, dict[str, Any]] = OrderedDict()
    for raw in raw_tags:
        cleaned = " ".join(raw.split())
        kind = classify_kind(cleaned)
        name = extract_name(cleaned, kind)
        key = f"{kind}::{cleaned}"
        if key not in buckets:
            buckets[key] = {
                "name": name,
                "kind": kind,
                "raw": cleaned,
                "count": 0,
            }
        buckets[key]["count"] += 1

    return list(buckets.values())


def classify_kind(raw: str) -> str:
    inner = raw.strip()
    if inner.startswith("{{") and inner.endswith("}}"):
        return "var"
    if not (inner.startswith("{%") and inner.endswith("%}")):
        return "other"
    body = inner[2:-2].strip().lower()
    # docxtpl row loop: {%tr for ...%} (space after {% optional in Word)
    if re.match(r"^tr\s+for\b", body):
        return "tr_for"
    if body.startswith("for ") or re.match(r"^for\b", body):
        return "for"
    if body.startswith("if ") or re.match(r"^if\b", body):
        return "if"
    return "other"


def extract_name(raw: str, kind: str) -> str:
    if kind == "var":
        m = re.match(r"\{\{\s*(.+?)\s*\}\}", raw, re.DOTALL)
        if not m:
            return raw
        expr = m.group(1).strip()
        # filters: ClientName|default('') → ClientName
        expr = expr.split("|", 1)[0].strip()
        # dotted: item.name → item.name (keep as variable path)
        return expr

    body_m = re.match(r"\{%\s*(.+?)\s*%\}", raw, re.DOTALL)
    if not body_m:
        return raw
    body = body_m.group(1).strip()

    if kind == "tr_for":
        m = re.search(r"\btr\s+for\s+\w+\s+in\s+([.\w]+)", body, re.IGNORECASE)
        return m.group(1) if m else body
    if kind == "for":
        m = re.search(r"\bfor\s+\w+\s+in\s+([.\w]+)", body, re.IGNORECASE)
        return m.group(1) if m else body
    if kind == "if":
        m = re.match(r"if\s+(.+)", body, re.IGNORECASE)
        if not m:
            return body
        cond = m.group(1).strip()
        # first identifier-ish token
        tok = re.match(r"([.\w]+)", cond)
        return tok.group(1) if tok else cond
    # endfor / else / endif / etc.
    return body.split()[0] if body.split() else body


def _read_bytes(source: TemplateSource) -> bytes:
    if isinstance(source, (bytes, bytearray)):
        return bytes(source)
    if isinstance(source, str):
        with open(source, "rb") as fh:
            return fh.read()
    if hasattr(source, "read"):
        data = source.read()
        if isinstance(data, str):
            return data.encode("utf-8")
        return bytes(data)
    raise TypeError("template must be bytes, path, or file-like")


def _extract_paragraph_texts(docx_bytes: bytes) -> list[str]:
    """Glue adjacent w:t runs inside each paragraph across document parts."""
    texts: list[str] = []
    with zipfile.ZipFile(io.BytesIO(docx_bytes)) as zf:
        # Main document + headers/footers + footnotes often hold tags.
        names = [
            n
            for n in zf.namelist()
            if n.startswith("word/")
            and n.endswith(".xml")
            and (
                n == "word/document.xml"
                or n.startswith("word/header")
                or n.startswith("word/footer")
                or n.startswith("word/footnotes")
                or n.startswith("word/endnotes")
            )
        ]
        for name in sorted(names):
            root = ET.fromstring(zf.read(name))
            for para in root.iter(f"{{{W_NS}}}p"):
                glued = "".join(
                    (node.text or "") for node in para.iter(f"{{{W_NS}}}t")
                )
                if glued.strip():
                    texts.append(glued)
    return texts
