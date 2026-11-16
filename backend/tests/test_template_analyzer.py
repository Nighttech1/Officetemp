"""Template Analyzer unit tests."""

from __future__ import annotations

from pathlib import Path

from app.services.template_analyzer import analyze_template, classify_kind, extract_name

FIXTURES = Path(__file__).resolve().parent / "fixtures" / "docx"


def test_analyze_flat_tags():
    path = FIXTURES / "flat_tags.docx"
    assert path.is_file()
    tags = analyze_template(path.read_bytes())
    by_name = {t["name"]: t for t in tags}
    assert "ClientName" in by_name
    assert by_name["ClientName"]["kind"] == "var"
    assert "{{ ClientName }}" in by_name["ClientName"]["raw"]
    assert by_name["ClientName"]["count"] >= 1
    assert "ContractDate" in by_name
    assert by_name["ContractDate"]["kind"] == "var"


def test_analyze_dynamic_table_kinds():
    path = FIXTURES / "dynamic_table.docx"
    assert path.is_file()
    tags = analyze_template(path.read_bytes())
    kinds = {t["name"]: t["kind"] for t in tags}
    assert kinds.get("items") == "tr_for"
    assert any(t["kind"] == "var" and "item.name" in t["name"] for t in tags) or any(
        "item.name" in t["raw"] for t in tags
    )
    # endfor classified as other
    assert any(t["kind"] == "other" for t in tags)


def test_analyze_split_runs():
    path = FIXTURES / "split_runs.docx"
    assert path.is_file()
    tags = analyze_template(path.read_bytes())
    names = {t["name"] for t in tags}
    assert "ClientName" in names
    client = next(t for t in tags if t["name"] == "ClientName")
    assert client["kind"] == "var"


def test_classify_and_extract_helpers():
    assert classify_kind("{{ ClientName }}") == "var"
    assert classify_kind("{%tr for item in items %}") == "tr_for"
    assert classify_kind("{% tr for item in items %}") == "tr_for"
    assert classify_kind("{% for x in rows %}") == "for"
    assert classify_kind("{% if ShowClause %}") == "if"
    assert classify_kind("{% endfor %}") == "other"
    assert extract_name("{{ ClientName }}", "var") == "ClientName"
    assert extract_name("{%tr for item in items %}", "tr_for") == "items"
