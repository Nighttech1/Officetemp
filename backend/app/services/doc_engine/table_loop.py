"""Ensure Word tables with flat {{tags}} expand for multi-row context."""

from __future__ import annotations

import io
import re
from copy import deepcopy
from typing import Any

from docx import Document
from docx.oxml.ns import qn

_TAG_RE = re.compile(r"\{\{\s*([^{}|%]+?)\s*\}\}")


def _plain(text: str) -> str:
    return (text or "").replace("\n", " ").strip()


def _clear_tr_text(tr) -> None:
    for t_el in tr.iter(qn("w:t")):
        t_el.text = ""


def _insert_row_before(table, row_idx: int):
    ref = table.rows[row_idx]._tr
    new_tr = deepcopy(ref)
    _clear_tr_text(new_tr)
    ref.addprevious(new_tr)
    return table.rows[row_idx]


def _insert_row_after(table, row_idx: int):
    ref = table.rows[row_idx]._tr
    new_tr = deepcopy(ref)
    _clear_tr_text(new_tr)
    ref.addnext(new_tr)
    return table.rows[row_idx + 1]


def ensure_table_row_loops(template_bytes: bytes, context: dict[str, Any]) -> bytes:
    """
    Wrap a flat ``{{tag}}`` table body row in ``{%tr for item in items %}`` …
    ``{%tr endfor %}`` when ``items`` has 2+ rows and the table has no loop yet.
    Pattern matches ``tests/fixtures/docx/dynamic_table.docx``.
    """
    items = context.get("items")
    if not isinstance(items, list):
        items = context.get("rows")
    n_items = len(items) if isinstance(items, list) else 0

    if n_items < 2:
        return template_bytes

    if not isinstance(context.get("items"), list):
        context["items"] = items

    doc = Document(io.BytesIO(template_bytes))
    rewrote = 0

    for table in doc.tables:
        table_text = " | ".join(_plain(c.text) for row in table.rows for c in row.cells)
        if "{%tr" in table_text.replace(" ", "") or "tr for" in table_text:
            continue
        if len(table.rows) < 2:
            continue

        body_idx = None
        for ri in range(1, len(table.rows)):
            joined = " | ".join(_plain(c.text) for c in table.rows[ri].cells)
            tags = [t.strip() for t in _TAG_RE.findall(joined)]
            flat = [t for t in tags if "." not in t]
            if flat and len(flat) == len(tags):
                body_idx = ri
                break
        if body_idx is None:
            continue

        for cell in table.rows[body_idx].cells:
            raw = cell.text or ""
            if not _TAG_RE.search(raw):
                continue
            cell.text = _TAG_RE.sub(
                lambda m: "{{ item.%s }}" % m.group(1).strip().split("|")[0].strip(),
                raw,
            )

        end_row = _insert_row_after(table, body_idx)
        end_row.cells[0].text = "{%tr endfor %}"

        for_row = _insert_row_before(table, body_idx)
        for_row.cells[0].text = "{%tr for item in items %}"

        rewrote += 1

    if rewrote == 0:
        return template_bytes

    out = io.BytesIO()
    doc.save(out)
    return out.getvalue()
