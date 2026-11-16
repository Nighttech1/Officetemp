"""Regenerate committed .docx fixtures for Doc Engine / Template Analyzer tests.

Run from backend/:

    python tests/fixtures/docx/build_fixtures.py
"""

from __future__ import annotations

import zipfile
from io import BytesIO
from pathlib import Path
from xml.etree import ElementTree as ET

from docx import Document

OUT_DIR = Path(__file__).resolve().parent
W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"


def build_flat_tags() -> Path:
    doc = Document()
    doc.add_heading("Contract", level=1)
    doc.add_paragraph("Client: {{ ClientName }}")
    doc.add_paragraph("Date: {{ ContractDate }}")
    path = OUT_DIR / "flat_tags.docx"
    doc.save(path)
    return path


def build_dynamic_table() -> Path:
    """
    docxtpl row loop pattern (tags live on their own rows and are stripped):

        header | Name | Qty |
        {%tr for item in items %}
        {{ item.name }} | {{ item.qty }}
        {%tr endfor %}
    """
    doc = Document()
    doc.add_heading("Items", level=1)
    table = doc.add_table(rows=4, cols=2)
    table.style = "Table Grid"
    table.rows[0].cells[0].text = "Name"
    table.rows[0].cells[1].text = "Qty"
    table.rows[1].cells[0].text = "{%tr for item in items %}"
    table.rows[1].cells[1].text = ""
    table.rows[2].cells[0].text = "{{ item.name }}"
    table.rows[2].cells[1].text = "{{ item.qty }}"
    table.rows[3].cells[0].text = "{%tr endfor %}"
    table.rows[3].cells[1].text = ""
    path = OUT_DIR / "dynamic_table.docx"
    doc.save(path)
    return path


def build_split_runs() -> Path:
    """Create a paragraph where {{ ClientName }} is split across multiple w:t runs."""
    doc = Document()
    p = doc.add_paragraph()
    # Normal run prefix
    run_a = p.add_run("Hello ")
    run_b = p.add_run("{{ Cli")
    run_c = p.add_run("entName }}")
    run_d = p.add_run("!")
    _ = (run_a, run_b, run_c, run_d)
    path = OUT_DIR / "split_runs.docx"
    doc.save(path)

    # Verify OOXML actually has multiple w:t nodes (python-docx usually does).
    with zipfile.ZipFile(path, "r") as zf:
        xml = zf.read("word/document.xml")
    root = ET.fromstring(xml)
    texts = [t.text or "" for t in root.iter(f"{{{W_NS}}}t")]
    glued = "".join(texts)
    if "{{ ClientName }}" not in glued:
        raise RuntimeError("split_runs fixture missing ClientName tag after glue")
    return path


def build_legal_spec_sample() -> Path:
    doc = Document()
    doc.add_heading("Agreement", level=1)
    doc.add_paragraph("Party: {{ ClientName }}")
    doc.add_paragraph("{% if ShowClause %}Clause A{% endif %}")
    table = doc.add_table(rows=4, cols=1)
    table.rows[0].cells[0].text = "Line"
    table.rows[1].cells[0].text = "{%tr for row in rows %}"
    table.rows[2].cells[0].text = "{{ row.title }}"
    table.rows[3].cells[0].text = "{%tr endfor %}"
    path = OUT_DIR / "legal_spec_sample.docx"
    doc.save(path)
    return path


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    built = [
        build_flat_tags(),
        build_dynamic_table(),
        build_split_runs(),
        build_legal_spec_sample(),
    ]
    for p in built:
        print(f"wrote {p}")


if __name__ == "__main__":
    main()
