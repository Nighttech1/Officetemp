import sys
import zipfile
from pathlib import Path

sys.path.insert(0, r"e:\Applications\OfficeTemp\backend")
from app.services.doc_engine.render import render_docx

docx = next(
    x
    for x in Path(r"e:/Applications/OfficeTemp/templates").glob("*09.09.26.docx")
    if not x.name.startswith("~$") and zipfile.is_zipfile(x)
)
out = render_docx(
    docx.read_bytes(),
    {
        "NN": "42",
        "date": "03.10.2026",
        "number": "1",
        "name": "t",
        "code": "c",
        "items": [{"number": "1", "name": "a", "code": "x"}],
    },
)
with zipfile.ZipFile(__import__("io").BytesIO(out)) as z:
    xml = z.read("word/document.xml").decode("utf-8", "replace")
print(
    "ok",
    len(out),
    "centers",
    xml.count('w:val="center"'),
    "wrw",
    "w:r_w:" in xml,
)
