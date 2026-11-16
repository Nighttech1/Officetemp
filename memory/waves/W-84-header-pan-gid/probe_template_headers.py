"""Probe header/footer images in Накладная1 template."""
from __future__ import annotations

import json
import re
import zipfile
from pathlib import Path

root = Path(r"e:/Applications/OfficeTemp/templates")
tpl = next(root.glob("*09.09.26.docx"))
out = {
    "template": str(tpl),
    "headers": [],
    "footers": [],
    "media": [],
    "document_rels_header_refs": [],
}

with zipfile.ZipFile(tpl) as z:
    names = z.namelist()
    out["media"] = [n for n in names if n.startswith("word/media/")]
    for n in names:
        low = n.lower()
        if "header" in low and n.endswith(".xml") and not n.endswith(".rels"):
            data = z.read(n).decode("utf-8", errors="replace")
            blips = re.findall(r'r:embed="([^"]+)"', data)
            drawings = data.count("w:drawing") + data.count("w:pict")
            texts = re.findall(r"<w:t[^>]*>([^<]*)</w:t>", data)
            out["headers"].append(
                {
                    "part": n,
                    "blips": blips,
                    "drawings": drawings,
                    "text_sample": " ".join(t for t in texts if t.strip())[:200],
                    "len": len(data),
                }
            )
            rels = n.replace("word/", "word/_rels/") + ".rels"
            if rels in names:
                out["headers"][-1]["rels"] = z.read(rels).decode("utf-8", errors="replace")
        if "footer" in low and n.endswith(".xml") and not n.endswith(".rels"):
            data = z.read(n).decode("utf-8", errors="replace")
            blips = re.findall(r'r:embed="([^"]+)"', data)
            drawings = data.count("w:drawing") + data.count("w:pict")
            texts = re.findall(r"<w:t[^>]*>([^<]*)</w:t>", data)
            out["footers"].append(
                {
                    "part": n,
                    "blips": blips,
                    "drawings": drawings,
                    "text_sample": " ".join(t for t in texts if t.strip())[:200],
                    "len": len(data),
                }
            )
    # sectPr header refs in document
    doc = z.read("word/document.xml").decode("utf-8", errors="replace")
    refs = re.findall(r'w:(header|footer)Reference[^>]+r:id="([^"]+)"[^/]*/>', doc)
    out["document_refs"] = refs
    if "word/_rels/document.xml.rels" in names:
        rels = z.read("word/_rels/document.xml.rels").decode("utf-8", errors="replace")
        out["document_rels"] = rels

print(json.dumps(out, ensure_ascii=False, indent=2))
