"""Unit tests for {% tr for %} dynamic table rows."""

from __future__ import annotations

from io import BytesIO
from pathlib import Path

from docx import Document

from app.services.doc_engine import render_docx

FIXTURES = Path(__file__).resolve().parent / "fixtures" / "docx"
TABLE = FIXTURES / "dynamic_table.docx"


def test_tr_for_expands_table_rows():
    assert TABLE.is_file(), "run tests/fixtures/docx/build_fixtures.py"
    items = [
        {"name": "Alpha", "qty": 1},
        {"name": "Beta", "qty": 2},
        {"name": "Gamma", "qty": 3},
    ]
    rendered = render_docx(TABLE.read_bytes(), {"items": items})
    doc = Document(BytesIO(rendered))
    assert len(doc.tables) >= 1
    table = doc.tables[0]
    # 1 header + N data rows
    assert len(table.rows) == 1 + len(items)
    body_names = [table.rows[i].cells[0].text.strip() for i in range(1, len(table.rows))]
    assert body_names == ["Alpha", "Beta", "Gamma"]
    body_qty = [table.rows[i].cells[1].text.strip() for i in range(1, len(table.rows))]
    assert body_qty == ["1", "2", "3"]
