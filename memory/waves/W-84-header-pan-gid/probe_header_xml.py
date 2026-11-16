"""Dump structure of header1.xml for floating vs inline image."""
from __future__ import annotations

import re
import zipfile
from pathlib import Path

tpl = next(Path(r"e:/Applications/OfficeTemp/templates").glob("*09.09.26.docx"))
with zipfile.ZipFile(tpl) as z:
    data = z.read("word/header1.xml").decode("utf-8")
    media = z.read("word/media/image1.jpg")
Path(r"e:/Applications/OfficeTemp/memory/waves/W-84-header-pan-gid/header1.xml").write_text(
    data, encoding="utf-8"
)
Path(r"e:/Applications/OfficeTemp/memory/waves/W-84-header-pan-gid/image1.jpg").write_bytes(media)
print("bytes header", len(data), "jpg", len(media))
print("has wp:anchor", "wp:anchor" in data)
print("has wp:inline", "wp:inline" in data)
print("has v:imagedata", "v:imagedata" in data)
print("has w:drawing", "w:drawing" in data)
print("has w:pict", "w:pict" in data)
# extract extent / position hints
for tag in ("wp:extent", "wp:positionH", "wp:positionV", "wp14:sizeRelH", "a:ext"):
    print(tag, data.count(tag))
# show first 1500 chars of drawing region
m = re.search(r"<w:drawing>.*?</w:drawing>", data, re.S)
if m:
    print("--- drawing snippet ---")
    print(m.group(0)[:2000])
