"""Prototype: crop signature images from stamp Подп. column."""

from __future__ import annotations

from pathlib import Path

import pymupdf

from app.services.iul_stamp import (
    DATE_RE,
    _find_roles_on_page,
    _page_score,
    _surname_right_of,
    _words,
)


def main() -> None:
    p = list(Path(r"E:/Applications/OfficeTemp/templates").glob("*.pdf"))[0]
    doc = pymupdf.open(p)
    scored = [(i, _page_score(doc[i])) for i in range(doc.page_count)]
    scored.sort(key=lambda t: -t[1])
    pi = scored[0][0]
    page = doc[pi]
    words = _words(page)
    roles = _find_roles_on_page(words)
    outdir = Path(
        r"E:/Applications/OfficeTemp/memory/tickets/C-67-sign-source-toggle/crops"
    )
    outdir.mkdir(parents=True, exist_ok=True)
    print("page", pi + 1, "roles", len(roles))
    for role_box in sorted(roles, key=lambda r: r[1]):
        role = role_box[4]
        surname, _signed = _surname_right_of(words, role_box)
        ry0 = role_box[1]
        surname_w = None
        date_w = None
        for w in words:
            if abs(w[1] - ry0) <= 8 and w[4] == surname and w[0] > role_box[2]:
                surname_w = w
                break
        if surname_w:
            for w in words:
                if (
                    abs(w[1] - ry0) <= 8
                    and DATE_RE.match(w[4])
                    and w[0] > surname_w[2]
                ):
                    date_w = w
                    break
        print(role, surname, bool(surname_w), bool(date_w))
        if not surname_w or not date_w:
            continue
        x0 = surname_w[2] + 1
        x1 = max(date_w[0] - 1, x0 + 20)
        y0 = min(role_box[1], surname_w[1]) - 3
        y1 = max(role_box[3], surname_w[3]) + 10
        # ensure reasonable width for handwritten signature
        if x1 - x0 < 25:
            x1 = x0 + 40
        clip = pymupdf.Rect(x0, y0, x1, y1)
        pix = page.get_pixmap(matrix=pymupdf.Matrix(3, 3), clip=clip, alpha=False)
        safe = f"{role}_{surname}".replace(" ", "_").replace(".", "")
        out = outdir / f"{safe}.png"
        pix.save(out)
        print(" saved", out.name, pix.width, "x", pix.height, "clip", clip)


if __name__ == "__main__":
    main()
