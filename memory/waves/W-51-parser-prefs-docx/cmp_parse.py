from pathlib import Path
from app.services.iul_stamp import analyze_stamp_pdf

T = Path(r"e:\Applications\OfficeTemp\templates")
out = Path(r"e:\Applications\OfficeTemp\memory\waves\W-51-parser-prefs-docx\compare.txt")
lines = []
for pdf in sorted(T.glob("*.pdf"))[:10]:
    rr = analyze_stamp_pdf(pdf.read_bytes(), pdf.name, extract_signatures=False)
    lines.append(f"{pdf.name}\n  name={rr.doc_name!r}\n  des={rr.doc_designation!r}\n")
out.write_text("\n".join(lines), encoding="utf-8")
print("wrote", out, "n=", len(lines))
