import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pymupdf
from app.services.iul_stamp import (
    analyze_stamp_pdf,
    _pick_designation,
    _words,
    _pick_object_and_sheet_name,
    _filename_hints,
    _page_score,
    _find_roles_on_page,
    DESIGNATION_RE,
)

p = Path(r"e:\Applications\OfficeTemp\templates\56-0321-ОК-1-2-КЖ6.2.pdf")
out = Path(r"e:\Applications\OfficeTemp\memory\tickets\_tmp_kj6_debug.txt")
lines: list[str] = []
lines.append("file=" + p.name)
lines.append("hints=" + repr(_filename_hints(p.name)))
data = p.read_bytes()
r = analyze_stamp_pdf(data, p.name, extract_signatures=False)
lines.append("des=" + repr(r.doc_designation))
lines.append("name=" + repr(r.doc_name))
lines.append("obj=" + repr(r.object_name))
lines.append("sigs=" + repr([(s.role, s.surname, s.signed_at) for s in r.signatures]))
lines.append("warn=" + repr(r.warnings))
doc = pymupdf.open(stream=data, filetype="pdf")
best = max(range(doc.page_count), key=lambda i: _page_score(doc[i]))
words = _words(doc[best])
lines.append("best_page=" + str(best + 1))
lines.append("pick_des=" + repr(_pick_designation(words)))
pick = _pick_designation(words)
obj, sheet = _pick_object_and_sheet_name(words, pick or r.doc_designation)
lines.append("obj_sheet=" + repr((obj, sheet)))
toks = [w[4] for w in words if "56" in w[4] or "КЖ" in w[4] or "-" in w[4]]
lines.append("des_tokens=" + repr(toks[:60]))
for i in (1, 17):
    page_words = _words(doc[i])
    roles = _find_roles_on_page(page_words)
    lines.append(f"roles_p{i+1}=" + repr([x[4] for x in roles]))
    roleish = sorted(
        {
            w[4]
            for w in page_words
            if any(
                x in w[4].lower().replace("ё", "е")
                for x in ["контр", "норм", "разраб", "провер", "гип", "утв"]
            )
        }
    )
    lines.append(f"roleish_p{i+1}=" + repr(roleish))
stem = p.stem
lines.append("stem=" + repr(stem))
lines.append("re_stem=" + repr(DESIGNATION_RE.search(stem.replace(" ", ""))))
# join tokens around designation
joined = "".join(w[4] for w in words)
m = DESIGNATION_RE.findall(joined)
lines.append("findall_joined=" + repr(m[:10]))
out.write_text("\n".join(lines), encoding="utf-8")
print("OK")
