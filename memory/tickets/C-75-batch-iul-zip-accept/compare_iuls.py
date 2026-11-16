# -*- coding: utf-8 -*-
"""Compare unzipped IULs vs templates PDFs."""
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

try:
    import fitz  # pymupdf
except ImportError:
    fitz = None

ROOT = Path(r"E:\Applications\OfficeTemp")
TEMPLATES = ROOT / "templates"
IULS = ROOT / "memory/tickets/C-75-batch-iul-zip-accept/artifacts/unzipped"
OUT = ROOT / "memory/tickets/C-75-batch-iul-zip-accept/artifacts/compare.json"


def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def pdf_text(p: Path) -> str:
    if fitz is None:
        return p.read_bytes().decode("latin-1", errors="ignore")
    doc = fitz.open(p)
    parts = [page.get_text() for page in doc]
    doc.close()
    return "\n".join(parts)


def main() -> None:
    sources = sorted(TEMPLATES.glob("*.pdf"), key=lambda p: p.name.lower())
    iuls = sorted(IULS.glob("*.pdf"), key=lambda p: p.name.lower())
    results = []
    matched = 0
    for src in sources:
        stem = src.stem
        exact = [i for i in iuls if i.name.startswith(stem)]
        pick = exact[0] if exact else None
        if pick is None:
            for i in iuls:
                if stem[:35] in i.name:
                    pick = i
                    break
        src_hash = sha256(src)
        row: dict = {
            "source": src.name,
            "source_size": src.stat().st_size,
            "source_sha256": src_hash,
            "iul": pick.name if pick else None,
            "iul_size": pick.stat().st_size if pick else 0,
        }
        if not pick:
            row["ok"] = False
            row["reason"] = "no matching IUL in zip"
            results.append(row)
            print("FAIL\tno iul for", src.name)
            continue
        text = pdf_text(pick)
        row["iul_text_len"] = len(text)
        low = text.lower()
        row["has_title"] = (
            "удостоверительн" in low
            or "информационно" in low
            or "informacionno" in low
        )
        row["mentions_source_name"] = (
            stem[:18] in text or src.name[:22] in text or stem[:12] in text
        )
        row["mentions_hash"] = (
            src_hash[:16].lower() in low or src_hash[:12].lower() in low
        )
        row["has_hex_hash"] = bool(re.search(r"[a-f0-9]{40,}", text, re.I))
        row["ok"] = bool(
            pick.stat().st_size > 1000
            and (row["mentions_source_name"] or row["has_title"])
            and (row["mentions_hash"] or row["has_hex_hash"])
        )
        if row["ok"]:
            matched += 1
        print(
            f"{'OK' if row['ok'] else 'FAIL'}\t"
            f"name_in={row['mentions_source_name']}\t"
            f"hash_in={row['mentions_hash']}\t"
            f"hex={row['has_hex_hash']}\t"
            f"{src.name[:50]} -> {pick.name[:50]}"
        )
        results.append(row)

    summary = {
        "sources": len(sources),
        "iuls": len(iuls),
        "matched_ok": matched,
        "all_ok": matched == len(sources) == len(iuls),
        "results": results,
    }
    OUT.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print("SUMMARY", summary["all_ok"], f"{matched}/{len(sources)}")


if __name__ == "__main__":
    main()
