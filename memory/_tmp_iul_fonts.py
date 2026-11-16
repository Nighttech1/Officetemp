from docx import Document
from pathlib import Path
p = Path(r"e:\Applications\OfficeTemp\templates")
docx = next(p.glob("*template*.docx"))
print("FILE", docx.name)
doc = Document(str(docx))
fonts=set(); bolds=set()
for t_i,t in enumerate(doc.tables):
    print(f"\n=== TABLE {t_i} rows={len(t.rows)} cols={len(t.columns)} ===")
    for r_i,row in enumerate(t.rows[:8]):
        cells=[]
        for c in row.cells:
            runs_info=[]
            for para in c.paragraphs:
                for run in para.runs:
                    f=run.font
                    name=f.name or (para.style.font.name if para.style and para.style.font else None)
                    bold=f.bold
                    size=f.size.pt if f.size else None
                    runs_info.append((run.text[:40].replace("\n"," "), name, bold, size))
                    if name: fonts.add(name)
                    bolds.add(bold)
            txt=c.text[:50].replace("\n"," | ")
            cells.append(txt)
        print(f"R{r_i}: {cells}")
print("\nFONTS", fonts)
print("BOLD values seen", bolds)
# also check styles
for s in doc.styles:
    try:
        if s.font and s.font.name:
            fonts.add(s.font.name)
    except: pass
print("ALL FONTS", fonts)
