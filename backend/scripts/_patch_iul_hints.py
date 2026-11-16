from pathlib import Path

p = Path(r"e:\Applications\OfficeTemp\backend\app\services\iul_stamp.py")
text = p.read_text(encoding="utf-8")

start = text.find("IZM_RE = re.compile")
end = text.find("\ndef _page_score")
if start < 0 or end < 0:
    raise SystemExit(f"markers not found start={start} end={end}")

replacement = r'''IZM_RE = re.compile(r"\(?\s*Изм\.?\s*(\d+)\s*\)?", re.IGNORECASE)


def _izm_suffix_from_name(name: str) -> tuple[str, str]:
    """Extract Изм.N suffix for designation; return (suffix, name_without_izm)."""
    m = IZM_RE.search(name)
    if not m:
        return "", name
    suffix = f" (Изм. {m.group(1)})"
    cleaned = IZM_RE.sub("", name).strip()
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" .-_")
    return suffix, cleaned


def _parse_date(raw: str) -> str:
    m = DATE_RE.match(raw.strip())
    if not m:
        return ""
    d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
    if y < 100:
        y += 2000
    return f"{y:04d}-{mo:02d}-{d:02d}"


def _filename_hints(filename: str | None) -> tuple[str, str, str]:
    """Return (designation, doc_name, version).

    designation — полный шифр с приписками Изм. N;
    doc_name — текстовое наименование (не шифр);
    version из Изм не заполняем (в бланке «-» если пусто).
    """
    if not filename:
        return "", "", ""
    name = Path(filename).stem
    izm_suffix, name = _izm_suffix_from_name(name)
    # Clean repeated (1)(1)
    name = re.sub(r"\(\d+\)", "", name).strip()
    name = re.sub(r"\s+", " ", name)
    m_des = DESIGNATION_RE.search(name.replace(" ", ""))
    m_des2 = re.search(
        r"(\d{2}-\d{4}-[А-ЯA-Z0-9\-]+(?:\.\d+)?)",
        name,
        re.IGNORECASE,
    )
    if m_des2:
        designation = m_des2.group(1) + izm_suffix
        rest = name[m_des2.end() :].strip(" .-_")
        doc_name = rest or ""
        return designation, doc_name, ""
    if m_des:
        return m_des.group(0) + izm_suffix, "", ""
    return "", name, ""
'''

p.write_text(text[:start] + replacement + text[end:], encoding="utf-8")
print("patched", start, end)
