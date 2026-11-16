"""Parse GOST drawing title block (штамп) from a signed PDF for IUL autofill."""

from __future__ import annotations

import base64
import os
import re
from dataclasses import dataclass, field
from pathlib import Path

import pymupdf

# Roles that appear in the left column of the stamp (longest first for matching).
ROLE_PATTERNS: tuple[str, ...] = (
    "Зам. нач. отд.",
    "Зам.нач.отд.",
    "Нормоконтроль",
    "Нормоконтроль.",
    "Н. контроль",
    "Н. Контроль",
    "Н.контроль",
    "Н контроль",
    "Н. контр.",
    "Н.контр.",
    "Н. контр",
    "Н.контр",
    "Разработал",
    "Проверил",
    "Согласовано",
    "ГИП",
    "Утв.",
    "Составил",
    "Изм. внес",
)

ROLE_NORMALIZE = {
    "Н.контр.": "Н. контр.",
    "Н.контр": "Н. контр.",
    "Н. контр": "Н. контр.",
    "Н.контроль": "Н. контр.",
    "Н. контроль": "Н. контр.",
    "Н. Контроль": "Н. контр.",
    "Н контроль": "Н. контр.",
    "Нормоконтроль": "Н. контр.",
    "Нормоконтроль.": "Н. контр.",
    "Зам.нач.отд.": "Зам. нач. отд.",
}

# Compact forms that mean нормоконтроль (after lowercasing, strip dots/spaces).
_NORMOCONTROL_COMPACT = frozenset(
    {
        "нконтр",
        "нконтроль",
        "нормоконтроль",
        "нконт",
        "нормоконтр",
    },
)

# Ограниченный матч нормоконтроля по compact-форме (без «съедания» фамилии):
# ловит «нконтр», «нконтрол» (из «Н.контрол.»), «нконтроль», «нормоконтр(оль)».
_NORMOCONTROL_RE = re.compile(r"н(?:ормо)?контр(?:ол[ья]?)?", re.IGNORECASE)


def _is_normocontrol_compact(c: str) -> bool:
    """c — уже lower, ё→е, без точек/пробелов. Полное совпадение, не префикс
    по всей строке, чтобы «Н.контрол. Матковский» не схлопнулось в роль."""
    return c in _NORMOCONTROL_COMPACT or bool(_NORMOCONTROL_RE.fullmatch(c))


# Сокращённые формы ролей в штампе («Разраб.», «Провер.», «Сост.») — матчим
# только сам токен роли (fullmatch), фамилия в соседней ячейке не затрагивается.
_ROLE_ABBR_RE: dict[str, re.Pattern[str]] = {
    "Разработал": re.compile(r"разраб(?:\.|отал|отал\.|отчик)?", re.IGNORECASE),
    "Проверил": re.compile(r"провер(?:\.|ил|ил\.)?", re.IGNORECASE),
    "Составил": re.compile(r"состав(?:\.|ил|ил\.)?", re.IGNORECASE),
}

DESIGNATION_RE = re.compile(
    # Марочный суффикс после точки может быть цифровым (КЖ6.2) или буквенным
    # (ЭОМ.КВ) — допускаем 1–4 буквы/цифры.
    r"\d{2}-\d{4}-[А-ЯA-Z0-9\-]+(?:\.[0-9A-ZА-Я]{1,4})?",
    re.IGNORECASE,
)
# Хвостовой кусок шифра вроде КЖ6.2 / КМ3 (без «съедания» следующих слов)
_DES_TAIL_RE = re.compile(
    r"^[А-ЯA-Z]{1,4}\d+(?:\.\d+)?$",
    re.IGNORECASE,
)
SURNAME_RE = re.compile(r"^[А-ЯЁA-Z][а-яёa-zА-ЯЁA-Z\-]{1,40}$")
_SURNAME_STOP = frozenset(
    {
        "изм",
        "лист",
        "листов",
        "дата",
        "подп",
        "стадия",
        "формат",
        "кол",
        "общие",
        "данные",
        "район",
        "участок",
        "секция",
        "жилой",
        "дом",
    },
)
DATE_RE = re.compile(r"^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$")
# Только явные приписки: (Изм. N) / Изм. N / _Изм.N — не «ИЗМ3» как код.
IZM_RE = re.compile(
    r"(?:\(\s*Изм\.?\s*(\d+)\s*\)|(?:^|[_\s])Изм\.\s*(\d+))",
    re.IGNORECASE,
)


def _izm_suffix_from_name(name: str) -> tuple[str, str]:
    """Extract Изм.N suffix for designation; return (suffix, name_without_izm)."""
    m = IZM_RE.search(name)
    if not m:
        return "", name
    num = next(g for g in m.groups() if g)
    suffix = f" (Изм. {num})"
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


def _normalize_doc_name_text(name: str) -> str:
    """Убрать артефакты выгрузки PDF (многоточие, лишние пробелы)."""
    s = (name or "").strip()
    if not s:
        return ""
    s = s.replace("\u2026", ", ").replace("...", ", ")
    s = re.sub(r"\s*,\s*,+", ", ", s)
    s = re.sub(r"\s+", " ", s).strip(" .,;")
    return s


def _weak_filename_doc_name(name: str) -> bool:
    """Имя из файла вида «АР1.2 ИЗМ3» / короткий шифро-хвост — не наименование раздела."""
    s = _normalize_doc_name_text(name)
    if not s:
        return True
    low = s.lower().replace("ё", "е")
    if low in _SHEET_ONLY_NAMES or "общие данные" in low:
        return True
    # Почти только код раздела + Изм: АР1.2, КЖ6.2 ИЗМ3, …
    compact = re.sub(r"[\s._\-]+", "", low)
    if re.fullmatch(
        r"(?:ар|кж|ас|ов|эс|вк|сс|пз|пд|рр|гп)[\d.]+(?:изм\d*)?",
        compact,
    ):
        return True
    if len(s) < 12 and re.search(r"изм", low) and not re.search(
        r"конструкц|плит|секци|перекрыт|стен",
        low,
    ):
        return True
    if DESIGNATION_RE.fullmatch(s.replace(" ", "")):
        return True
    return False


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
        r"(\d{2}-\d{4}-[А-ЯA-Z0-9\-]+(?:\.[0-9A-ZА-Я]{1,4})?)",
        name,
        re.IGNORECASE,
    )
    if m_des2:
        designation = m_des2.group(1) + izm_suffix
        rest = name[m_des2.end() :].strip(" .-_")
        rest = _normalize_doc_name_text(rest)
        # Не принимать «АР1.2 ИЗМ3» за наименование раздела
        doc_name = "" if _weak_filename_doc_name(rest) else rest
        return designation, doc_name, ""
    if m_des:
        return m_des.group(0) + izm_suffix, "", ""
    # Весь stem — не шифр: может быть названием, если не слабый
    cleaned = _normalize_doc_name_text(name)
    if _weak_filename_doc_name(cleaned):
        return "", "", ""
    return "", cleaned, ""


@dataclass
class StampSignature:
    role: str
    surname: str
    signed_at: str = ""
    """PNG bytes as base64 (no data: prefix), cropped from stamp Подп. column."""
    signature_png_base64: str = ""


@dataclass
class StampParseResult:
    object_name: str = ""
    doc_designation: str = ""
    doc_name: str = ""
    doc_version: str = ""
    ul_code: str = ""
    signatures: list[StampSignature] = field(default_factory=list)
    source_page: int | None = None
    warnings: list[str] = field(default_factory=list)


def _norm_role(role: str) -> str:
    r = " ".join(role.split())
    if r in ROLE_NORMALIZE:
        return ROLE_NORMALIZE[r]
    compact = r.lower().replace("ё", "е").replace(".", "").replace(" ", "")
    if _is_normocontrol_compact(compact):
        return "Н. контр."
    return r


def _role_matches_pattern(text: str, text_compact: str, role: str) -> bool:
    if text == role or text_compact == role.replace(" ", ""):
        return True
    # ё-нечувствительно: «Изм. внёс» ↔ «Изм. внес» и т. п.
    def _e(s: str) -> str:
        return s.replace("ё", "е").replace("Ё", "Е")

    if _e(text) == _e(role) or _e(text_compact) == _e(role.replace(" ", "")):
        return True
    # Сокращённые формы роли («Разраб.», «Провер.», «Сост.») — только сам токен,
    # fullmatch по compact, чтобы не прихватить фамилию из соседней ячейки.
    abbr = _ROLE_ABBR_RE.get(role)
    if abbr is not None:
        tok = _e(text_compact).lower()
        if abbr.fullmatch(tok):
            return True
    # Fuzzy нормоконтроль: «Н.Контроль», «Нормоконтроль», «Н.контрол.» — без захвата фамилии
    if _norm_role(role) == "Н. контр.":
        c = text_compact.lower().replace("ё", "е").replace(".", "").replace(" ", "")
        if _is_normocontrol_compact(c):
            return True
    return False


def _page_score(page: pymupdf.Page) -> int:
    text = page.get_text() or ""
    score = 0
    for role in (
        "Разработал",
        "Проверил",
        "ГИП",
        "Н. контр",
        "Н.контр",
        "Нормоконтроль",
        "Н. Контроль",
        "Н. контроль",
    ):
        if role in text:
            score += 3
    # fuzzy score for нормоконтроль variants in page text
    compact_page = re.sub(r"[\s.]+", "", text.lower().replace("ё", "е"))
    if "нормоконтроль" in compact_page or "нконтр" in compact_page:
        score += 3
    if DESIGNATION_RE.search(text.replace("\n", "")):
        score += 2
    if "Стадия" in text and "Листов" in text:
        score += 2
    return score


def _words(page: pymupdf.Page) -> list[tuple[float, float, float, float, str]]:
    raw = page.get_text("words") or []
    return [(w[0], w[1], w[2], w[3], w[4]) for w in raw]


def _join_line(
    words: list[tuple[float, float, float, float, str]],
    y: float,
    x_min: float,
    x_max: float,
    y_tol: float = 6.0,
) -> str:
    parts = [
        w[4]
        for w in words
        if abs(w[1] - y) <= y_tol and x_min <= w[0] <= x_max
    ]
    return " ".join(parts).strip()


def _find_roles_on_page(
    words: list[tuple[float, float, float, float, str]],
) -> list[tuple[float, float, float, float, str]]:
    """Return (x0,y0,x1,y1,role) for role labels found left-to-right merge."""
    # Build lines by y-buckets
    by_y: dict[int, list[tuple[float, float, float, float, str]]] = {}
    for w in words:
        key = int(round(w[1] / 3) * 3)
        by_y.setdefault(key, []).append(w)

    found: list[tuple[float, float, float, float, str]] = []
    for _yk, row in by_y.items():
        row = sorted(row, key=lambda w: w[0])
        # sliding window concatenate for multi-word roles
        i = 0
        while i < len(row):
            matched = False
            for n in (4, 3, 2, 1):
                if i + n > len(row):
                    continue
                chunk = row[i : i + n]
                text = " ".join(c[4] for c in chunk)
                text_compact = text.replace(" ", "")
                for role in ROLE_PATTERNS:
                    if _role_matches_pattern(text, text_compact, role):
                        x0 = chunk[0][0]
                        y0 = min(c[1] for c in chunk)
                        x1 = chunk[-1][2]
                        y1 = max(c[3] for c in chunk)
                        found.append((x0, y0, x1, y1, _norm_role(role)))
                        i += n
                        matched = True
                        break
                if matched:
                    break
            if not matched:
                # Single-token fuzzy нормоконтроль (слово целиком)
                tok = row[i][4]
                if _norm_role(tok) == "Н. контр." and tok not in {
                    "Разработал",
                    "Проверил",
                    "ГИП",
                }:
                    w = row[i]
                    found.append((w[0], w[1], w[2], w[3], "Н. контр."))
                i += 1
    # Prefer stamp column: roles clustered on the right half for A1 landscape
    if not found:
        return []
    xs = [f[0] for f in found]
    median_x = sorted(xs)[len(xs) // 2]
    # Keep roles near the stamp (right side cluster)
    stamp_roles = [f for f in found if f[0] >= median_x - 80]
    return stamp_roles or found


def _surname_right_of(
    words: list[tuple[float, float, float, float, str]],
    role: tuple[float, float, float, float, str],
) -> tuple[str, str]:
    """Nearest surname to the right of role; optional date further right."""
    rx1, ry0 = role[2], role[1]
    candidates = [
        w
        for w in words
        if abs(w[1] - ry0) <= 8
        and w[0] > rx1 + 2
        and SURNAME_RE.match(w[4])
        and w[4].lower().replace("ё", "е") not in _SURNAME_STOP
    ]
    if not candidates:
        return "", ""
    candidates.sort(key=lambda w: w[0])
    surname = candidates[0][4]
    # date to the right of surname
    sx1 = candidates[0][2]
    dates = [
        w
        for w in words
        if abs(w[1] - ry0) <= 8 and w[0] > sx1 and DATE_RE.match(w[4])
    ]
    dates.sort(key=lambda w: w[0])
    signed_at = _parse_date(dates[0][4]) if dates else ""
    return surname, signed_at


def _podp_column_x(
    words: list[tuple[float, float, float, float, str]],
) -> tuple[float, float] | None:
    """X-range of Подп. column from header word, if present."""
    hits = [w for w in words if w[4] in {"Подп.", "Подп", "Подпись"}]
    if not hits:
        return None
    # Prefer the one near stamp (right side)
    hits.sort(key=lambda w: w[0], reverse=True)
    h = hits[0]
    # Typical GOST: Подп. column ~ surname→date; widen a bit around header
    return h[0] - 4, h[2] + 28


def _bleach_grid_keep_ink(pix: pymupdf.Pixmap) -> pymupdf.Pixmap:
    """Turn near-black table lines white; keep bluish/dark ink strokes."""
    if pix.alpha:
        pix = pymupdf.Pixmap(pix, 0)  # drop alpha
    if pix.n != 3:
        pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
    samples = bytearray(pix.samples)
    for i in range(0, len(samples), 3):
        r, g, b = samples[i], samples[i + 1], samples[i + 2]
        # black/gray grid → white
        if r < 50 and g < 50 and b < 50:
            samples[i] = samples[i + 1] = samples[i + 2] = 255
            continue
        if r > 240 and g > 240 and b > 240:
            continue
        # lighten pale gray (not ink)
        if abs(r - g) < 12 and abs(g - b) < 12 and r > 160:
            samples[i] = samples[i + 1] = samples[i + 2] = 255
    return pymupdf.Pixmap(pymupdf.csRGB, pix.width, pix.height, bytes(samples), False)


def _crop_signature_png(
    page: pymupdf.Page,
    words: list[tuple[float, float, float, float, str]],
    role_box: tuple[float, float, float, float, str],
    surname: str,
) -> str:
    """Return base64 PNG of Подп. cell for this role row, or empty string."""
    ry0 = role_box[1]
    surname_w = None
    date_w = None
    for w in words:
        if abs(w[1] - ry0) <= 8 and w[4] == surname and w[0] > role_box[2]:
            surname_w = w
            break
    if surname_w:
        for w in words:
            if abs(w[1] - ry0) <= 8 and DATE_RE.match(w[4]) and w[0] > surname_w[2]:
                date_w = w
                break
    if not surname_w:
        return ""

    col = _podp_column_x(words)
    if col:
        x0, x1 = col
        # keep column but ensure it sits after surname start
        x0 = max(x0, surname_w[0] + 8)
        if date_w:
            x1 = min(x1, date_w[0] - 1)
    else:
        x0 = surname_w[2] + 1
        x1 = (date_w[0] - 1) if date_w else x0 + 45
    if x1 - x0 < 18:
        x1 = x0 + 36

    y0 = min(role_box[1], surname_w[1]) - 3
    y1 = max(role_box[3], surname_w[3]) + 10
    clip = pymupdf.Rect(x0, y0, x1, y1)
    # clamp to page
    clip = clip & page.rect
    if clip.is_empty or clip.width < 4 or clip.height < 4:
        return ""
    try:
        pix = page.get_pixmap(matrix=pymupdf.Matrix(3, 3), clip=clip, alpha=False)
        pix = _bleach_grid_keep_ink(pix)
        return base64.b64encode(pix.tobytes("png")).decode("ascii")
    except Exception:  # noqa: BLE001
        return ""


def _pick_designation(words: list[tuple[float, float, float, float, str]]) -> str:
    """Pick шифр; merge adjacent tokens like «56-0321-ОК-1-2-» + «КЖ6.2»."""
    hits: list[tuple[int, float, str]] = []  # (len, score, value)

    def consider(raw: str, y: float, x: float) -> None:
        cleaned = raw.replace(" ", "")
        m = DESIGNATION_RE.match(cleaned) or DESIGNATION_RE.search(cleaned)
        if not m:
            return
        val = m.group(0)
        # Отсекаем «съеденный» хвост с прозой (длиннее типичного шифра)
        if len(val) > 40:
            return
        score = y + x * 0.001
        if val.endswith("-"):
            score -= 1000
        else:
            score += 50
        hits.append((len(val), score, val))

    ordered = sorted(words, key=lambda w: (round(w[1]), w[0]))
    for i, w in enumerate(ordered):
        consider(w[4], w[1], w[0])
        parts = [w[4]]
        for j in range(i + 1, min(i + 4, len(ordered))):
            nxt = ordered[j]
            if abs(nxt[1] - w[1]) > 8:
                break
            tok = nxt[4].strip()
            # Только продолжение шифра: «КЖ6.2», «-КЖ6.2», кусок после дефиса
            if not (
                _DES_TAIL_RE.match(tok)
                or tok.startswith("-")
                or (tok[:1].isdigit() and len(tok) <= 6)
            ):
                break
            parts.append(tok)
            consider("".join(parts), w[1], w[0])

    if not hits:
        text = "".join(w[4] for w in words)
        m = DESIGNATION_RE.search(text.replace(" ", ""))
        if not m:
            return ""
        val = m.group(0)
        return val if len(val) <= 40 else ""

    hits.sort(key=lambda h: (0 if h[2].endswith("-") else 1, h[0], h[1]), reverse=True)
    best = hits[0][2]
    if best.endswith("-"):
        longer = [
            h
            for h in hits
            if not h[2].endswith("-")
            and h[2].startswith(best.rstrip("-"))
            and len(h[2]) <= 40
        ]
        if longer:
            longer.sort(key=lambda h: h[0], reverse=True)
            return longer[0][2]
    return best


def _prefer_designation(stamp: str, from_file: str) -> str:
    """Prefer filename шифр for uploads; stamp tokens are often split/wrong."""
    s = (stamp or "").strip()
    f = (from_file or "").strip()

    def core(x: str) -> str:
        return re.sub(
            r"\s*\(?\s*Изм\.?\s*\d+\s*\)?",
            "",
            x,
            flags=re.I,
        ).strip().rstrip("-")

    def ok(x: str) -> bool:
        c = core(x)
        return bool(c) and len(c) <= 40 and bool(
            DESIGNATION_RE.fullmatch(c.replace(" ", ""))
        )

    if ok(f):
        return f
    if ok(s):
        return s
    return f or s


def _pick_object_and_sheet_name(
    words: list[tuple[float, float, float, float, str]],
    designation: str,
) -> tuple[str, str]:
    """Heuristic: object block near stamp. Sheet title (лист) — не наименование документа."""
    des_y = None
    des_x = None
    des_core = re.sub(
        r"\s*\(?\s*Изм\.?\s*\d+\s*\)?",
        "",
        designation or "",
        flags=re.I,
    ).strip()
    for w in words:
        token = w[4]
        if not des_core:
            break
        if des_core in token or token in des_core or (
            token.endswith("-") and des_core.startswith(token.rstrip("-"))
        ):
            des_y, des_x = w[1], w[0]
            break
    if des_y is None:
        for w in words:
            if DESIGNATION_RE.search(w[4].replace(" ", "")):
                des_y, des_x = w[1], w[0]
                break
    if des_y is None:
        return "", ""

    obj_parts: list[str] = []
    rows: dict[int, list[tuple[float, float, float, float, str]]] = {}
    for w in words:
        if w[1] < des_y - 2:
            continue
        if des_x is not None and w[0] < des_x - 20:
            continue
        key = int(round(w[1]))
        rows.setdefault(key, []).append(w)

    sorted_ys = sorted(rows.keys())
    for y in sorted_ys:
        line = " ".join(w[4] for w in sorted(rows[y], key=lambda t: t[0]))
        if not line.strip():
            continue
        if line.strip() in {"Стадия", "Лист", "Листов", "Р", "П", "А1", "A1", "Формат"}:
            continue
        if re.fullmatch(r"\d+", line.strip()):
            continue
        # «Общие данные» — имя листа в штампе, в объект не берём
        if re.search(r"Общие\s*данные", line, re.I) or line.strip() in {
            "Общие",
            "данные",
        }:
            continue
        if any(line.startswith(r) or line == r for r in ROLE_PATTERNS):
            continue
        if SURNAME_RE.fullmatch(line.strip()):
            continue
        if DATE_RE.match(line.strip()):
            continue
        if designation in line:
            continue
        if "Формат" in line:
            continue
        if len(line) >= 12 and not line.startswith("г."):
            obj_parts.append(line)
        elif line.startswith("г.") or "район" in line or "участок" in line:
            obj_parts.append(line)

    object_name = " ".join(obj_parts)
    object_name = re.sub(r"\s+", " ", object_name).strip()
    return object_name, ""


_TITLE_DOC_TYPE_RE = re.compile(
    r"^(?:рабочая|проектная)\s+документация\.?$",
    re.IGNORECASE,
)
_TITLE_FIELD_START_RE = re.compile(
    r"^(?:застройщик|заказчик|объект)\b",
    re.IGNORECASE,
)
# Служебные графы рамки/подшивки — не часть наименования документа:
# «Инв. № подл.», «Взам. инв. №», «Подп. и дата», «Согласовано:», «Утв.» …
_TITLE_MARGIN_LABEL_RE = re.compile(
    r"^\s*(?:"
    r"инв\.?\s*№|взам\.?\s*инв|подп\.?\s*и\s*дата|справ\.?\s*№|"
    r"перв\.?\s*примен|согласовано|утверждаю|утв\.?)",
    re.IGNORECASE,
)
# Альтернативный шифр на титуле: «10-21/6527 – КР2», «Том 4.2» рядом
_ALT_CIPHER_RE = re.compile(
    r"^\d{1,4}[-/]\d{1,6}\s*[/–—\-].{0,40}$",
)
_SHEET_ONLY_NAMES = frozenset(
    {
        "общие данные",
        "общие",
        "данные",
        "содержание",
        "титульный лист",
    },
)

# Примечания на листах чертежа — НЕ наименование документа
_DOC_NOTES_MARKERS = (
    "разработана в соответствии",
    "разработан в соответствии",
    "заданием на проектирование",
    "техническим условиям",
    "качество поверхности",
    "качеством поверхности",
    "гост ",
    "гост-",
    "поверхност",
    "категори",
    " класс ",
    "а3",
    "а4",
    "а5",
    "а6",
)


def _looks_like_doc_notes(name: str) -> bool:
    """True = это примечание/ГОСТ-текст, не краткое наименование с титула."""
    s = (name or "").strip()
    if not s:
        return True
    if len(s) > 220:
        return True
    low = s.lower().replace("ё", "е")
    if any(m in low for m in _DOC_NOTES_MARKERS):
        return True
    # Много предложений / перечислений — не заголовок
    if s.count(".") >= 4 and len(s) > 100:
        return True
    return False


def _score_doc_name(name: str) -> int:
    """Чем выше — тем лучше кандидат в «Наименование документа»."""
    if _looks_like_doc_notes(name):
        return -1000
    score = 50
    low = name.lower().replace("ё", "е")
    if re.search(
        r"отм\.|секци|плит|конструкц|перекрыт|фундамент|стен|балка|колонн",
        low,
    ):
        score += 40
    # Предпочитаем компактные названия (титул), не простыни
    n = len(name)
    if 12 <= n <= 120:
        score += 30
    elif n <= 180:
        score += 10
    else:
        score -= 40
    return score


def _page_text_lines(page: pymupdf.Page) -> list[str]:
    text = page.get_text() or ""
    lines: list[str] = []
    for raw in text.splitlines():
        line = re.sub(r"\s+", " ", raw).strip()
        if line:
            lines.append(line)
    return lines


def _looks_like_title_page(text: str) -> bool:
    low = text.lower().replace("ё", "е")
    hits = sum(
        1
        for m in (
            "застройщик",
            "заказчик",
            "объект",
            "рабочая документация",
            "проектная документация",
        )
        if m in low
    )
    if hits >= 2:
        return True
    if "документация" in low and (
        DESIGNATION_RE.search(text.replace("\n", "").replace(" ", ""))
        or _ALT_CIPHER_RE.search(text)
    ):
        return True
    # Короткая обложка с шифром (типичный титул РД)
    if len(text) < 2500 and DESIGNATION_RE.search(text.replace("\n", "").replace(" ", "")):
        return True
    return False


def _line_is_cipher(line: str) -> bool:
    """Строка — шифр/обозначение документа (не длинный абзац с вхождением цифр)."""
    if len(line) > 90:
        return False
    core = re.sub(
        r"\s*\(?\s*Изм\.?\s*\d+\s*\)?",
        "",
        line,
        flags=re.I,
    ).strip()
    compact = core.replace(" ", "")
    if DESIGNATION_RE.fullmatch(compact):
        return True
    if DESIGNATION_RE.match(compact) and len(compact) <= 48:
        # «56-0321-ОК-1-2-КЖ6.2 (изм. 1)» уже очищен
        return True
    if _ALT_CIPHER_RE.match(line.strip()):
        return True
    return False


def _is_title_stop_line(line: str) -> bool:
    low = line.lower().replace("ё", "е").strip()
    if _TITLE_DOC_TYPE_RE.match(low):
        return True
    if _TITLE_FIELD_START_RE.match(low):
        return True
    if re.fullmatch(r"\d{4}", low):
        return True
    if low in {"sign", "эцп", "подпись", "м.п.", "м. п."}:
        return True
    if low.startswith("том ") and len(low) < 24:
        return True
    if low.startswith("генеральный") or low.startswith("главный инженер"):
        return True
    return False


def _pick_doc_name_between_doctype_and_cipher(text: str) -> str:
    """Блок между «Рабочая/Проектная документация» и шифром — типичный титул РД/ПД.

    Берём **хвост перед шифром** (короткие строки), не весь span — иначе
    с чертежа уезжают примечания («разработана в соответствии с ГОСТ…»).
    """
    if not text:
        return ""
    flat = re.sub(r"[ \t]+", " ", text)
    flat = re.sub(r"\n+", "\n", flat)

    cipher_re = re.compile(
        r"(?P<cipher>"
        r"\d{2}-\d{4}-[А-ЯA-Z0-9\-]+(?:\.\d+)?"
        r"(?:\s*\(?\s*Изм\.?\s*\d+\s*\))?"
        r"|"
        r"\d{1,4}[-/]\d{1,6}\s*[/–—\-].{0,40}?"
        r")",
        re.IGNORECASE,
    )
    doctype_re = re.compile(
        r"(?:Рабочая|Проектная)\s+документация\.?",
        re.IGNORECASE,
    )

    best = ""
    best_score = -10_000
    for dm in doctype_re.finditer(flat):
        after = flat[dm.end() :]
        cm = cipher_re.search(after)
        if not cm:
            continue
        chunk = after[: cm.start()]
        chunk = re.split(r"\n\s*Том\s+\d", chunk, maxsplit=1, flags=re.I)[0]
        lines = [
            re.sub(r"\s+", " ", ln).strip(" .;")
            for ln in chunk.splitlines()
        ]
        lines = [ln for ln in lines if ln]
        cleaned: list[str] = []
        for ln in lines:
            low = ln.lower().replace("ё", "е")
            if _TITLE_FIELD_START_RE.match(ln) or _is_title_stop_line(ln):
                continue
            if _TITLE_MARGIN_LABEL_RE.match(ln):  # графы рамки/подшивки
                continue
            if low in _SHEET_ONLY_NAMES or "общие данные" in low:
                continue
            if _line_is_cipher(ln):
                continue
            if _looks_like_doc_notes(ln):
                continue
            cleaned.append(ln)
        if not cleaned:
            continue
        # Хвост перед шифром: 1–3 короткие строки (не весь блок)
        tail: list[str] = []
        for ln in reversed(cleaned):
            if _looks_like_doc_notes(ln) or len(ln) > 140:
                if tail:
                    break
                continue
            tail.append(ln)
            if len(tail) >= 3 or sum(len(x) for x in tail) > 160:
                break
        tail.reverse()
        name = re.sub(r"\s+", " ", " ".join(tail)).strip(" .;")
        if len(name) < 8:
            continue
        if name.lower().replace("ё", "е") in _SHEET_ONLY_NAMES:
            continue
        sc = _score_doc_name(name)
        if sc > best_score:
            best_score = sc
            best = name
    if best_score < 0:
        return ""
    return best


def _pick_doc_name_from_title_pages(doc: pymupdf.Document) -> str:
    """Наименование документа — блок над шифром на титульном листе (не имя листа штампа)."""
    limit = min(doc.page_count, 3)
    candidates: list[str] = []
    for i in range(limit):
        page = doc[i]
        text = page.get_text() or ""
        if not _looks_like_title_page(text):
            if not (i == 0 and len(text) < 4000):
                continue

        by_span = _pick_doc_name_between_doctype_and_cipher(text)
        if by_span and not _looks_like_doc_notes(by_span):
            candidates.append(by_span)

        lines = _page_text_lines(page)
        des_idx: int | None = None
        for j, line in enumerate(lines):
            if _line_is_cipher(line):
                des_idx = j
                break
        if des_idx is None:
            continue

        collected: list[str] = []
        for j in range(des_idx - 1, -1, -1):
            line = lines[j]
            if _is_title_stop_line(line):
                break
            low = line.lower().replace("ё", "е")
            if low in _SHEET_ONLY_NAMES or "общие данные" in low:
                continue
            if _TITLE_MARGIN_LABEL_RE.match(line):  # графы рамки/подшивки
                continue
            if DATE_RE.match(line) or _line_is_cipher(line):
                continue
            if _looks_like_doc_notes(line):
                break
            if any(
                line.startswith(r) or line == r
                for r in ("Разработал", "Проверил", "ГИП", "Н. контр", "Утв.")
            ):
                break
            if SURNAME_RE.fullmatch(line) and len(line) < 20:
                continue
            collected.append(line)
            if len(collected) >= 3:
                break
        collected.reverse()
        if not collected:
            continue
        name = re.sub(r"\s+", " ", " ".join(collected)).strip(" .;")
        if len(name) < 8:
            continue
        if name.lower().replace("ё", "е") in _SHEET_ONLY_NAMES:
            continue
        if DESIGNATION_RE.fullmatch(name.replace(" ", "")):
            continue
        if _looks_like_doc_notes(name):
            continue
        candidates.append(name)

    if not candidates:
        return ""
    return max(candidates, key=_score_doc_name)


# Номера изменений: «Изм. 2», «Изменение 1», «(изм.1)», строки «2 - Зам. …»
# Не брать «Изм.3.1» (пункт ведомости) — только целый номер изменения.
_REV_LABEL_RE = re.compile(
    r"(?:изм(?:енение)?\.?\s*)(\d{1,3})(?!\.\d)",
    re.IGNORECASE,
)
_REV_PAREN_RE = re.compile(
    r"\(\s*изм\.?\s*(\d{1,3})\s*\)",
    re.IGNORECASE,
)
_REV_TABLE_ROW_RE = re.compile(
    r"(?:^|[^\d])(\d{1,3})\s*[-–—]\s*(?:Зам\.?|Нов\.?|Аннул\.?)",
    re.IGNORECASE,
)


def _collect_revision_numbers_from_text(
    text: str,
    *,
    labels: bool = True,
    table_rows: bool = True,
) -> list[int]:
    nums: list[int] = []
    if not text:
        return nums
    patterns = []
    if labels:
        patterns.extend((_REV_PAREN_RE, _REV_LABEL_RE))
    if table_rows:
        patterns.append(_REV_TABLE_ROW_RE)
    for rx in patterns:
        for m in rx.finditer(text):
            try:
                n = int(m.group(1))
            except ValueError:
                continue
            if 1 <= n <= 99:
                nums.append(n)
    return nums


def _collect_revision_from_title_izm_table(text: str) -> list[int]:
    """Текст таблицы «Изм. | № док. | Подп. | Дата» → max из первой колонки.

    Пример (как на титуле): строки ``1 500/26 …`` и ``2 654/26 …`` → [1, 2].
    Без медленного page.find_tables().
    """
    nums: list[int] = []
    if not text:
        return nums
    lines = text.splitlines()
    header_i: int | None = None
    for i, line in enumerate(lines):
        low = line.lower().replace("ё", "е")
        if "изм" not in low:
            continue
        if any(x in low for x in ("док", "дата", "подп", "кол")):
            header_i = i
            break
    if header_i is None:
        return nums
    for line in lines[header_i + 1 : header_i + 24]:
        s = line.strip()
        if not s:
            continue
        if re.search(
            r"разработал|проверил|утверд|инв\.?\s*№|формат|стадия|лист\b",
            s,
            re.I,
        ):
            break
        # первая колонка — целое 1..99; дальше № док (500/26) или дата
        m = re.match(r"^(\d{1,3})(?!\.\d)(?:\s+|$)", s)
        if not m:
            if nums:
                break
            continue
        n = int(m.group(1))
        if not (1 <= n <= 99):
            continue
        rest = s[m.end() :]
        if rest and not re.search(
            r"\d+\s*/\s*\d{2,4}|\d{2}\.\d{2}\.\d{2,4}|Зам|Нов|Аннул|Подп",
            rest,
            re.I,
        ):
            # пустая/подпись-only строка после номера — тоже ок, если номер один
            if re.search(r"[A-Za-zА-Яа-яЁё]{4,}", rest) and not re.search(
                r"\d", rest,
            ):
                nums.append(n)
                continue
            if not rest.strip():
                nums.append(n)
                continue
            continue
        nums.append(n)
    return nums


def _pick_revision_from_tables(page: pymupdf.Page) -> list[int]:
    """Медленный fallback: page.find_tables() — колонка «Изм.»."""
    nums: list[int] = []
    try:
        finder = page.find_tables()
        tables = list(finder.tables) if finder else []
    except Exception:  # noqa: BLE001
        return nums
    for table in tables:
        try:
            data = table.extract() or []
        except Exception:  # noqa: BLE001
            continue
        if not data or len(data) < 2:
            continue
        header_idx = None
        izm_col: int | None = None
        for ri, row in enumerate(data[:4]):
            cells = [str(c or "").strip() for c in (row or [])]
            joined = " ".join(cells).lower().replace("ё", "е")
            if "изм" not in joined:
                continue
            if not any(x in joined for x in ("док", "дата", "подп", "кол")):
                if "изм." not in joined and "изм " not in joined:
                    continue
            header_idx = ri
            for ci, cell in enumerate(cells):
                cl = cell.lower().replace("ё", "е")
                if cl in {"изм", "изм.", "изм.№", "№изм"} or (
                    cl.startswith("изм") and len(cl) <= 8
                ):
                    izm_col = ci
                    break
            if izm_col is None:
                for ci, cell in enumerate(cells):
                    if "изм" in cell.lower():
                        izm_col = ci
                        break
            break
        if header_idx is None:
            continue
        for row in data[header_idx + 1 :]:
            cells = [str(c or "").strip() for c in (row or [])]
            if not any(cells):
                continue
            if izm_col is not None and izm_col < len(cells):
                cell = cells[izm_col]
                m = re.fullmatch(r"(\d{1,3})", cell)
                if m:
                    n = int(m.group(1))
                    if 1 <= n <= 99:
                        nums.append(n)
                    continue
            row_join = " ".join(cells)
            for m in _REV_TABLE_ROW_RE.finditer(row_join):
                n = int(m.group(1))
                if 1 <= n <= 99:
                    nums.append(n)
            if cells and re.fullmatch(r"\d{1,3}", cells[0]):
                if re.search(r"Зам|Нов|/2\d", row_join, re.I):
                    n = int(cells[0])
                    if 1 <= n <= 99:
                        nums.append(n)
    return nums


def _pick_revision_version(doc: pymupdf.Document) -> str:
    """Самый большой номер изменения → ячейка «Версия» ИУЛ (только цифра)."""
    nums: list[int] = []
    # 1) Титул: (изм. N) / Изм. N / текстовая таблица Изм|№ док|Дата
    for i in range(min(doc.page_count, 2)):
        text = doc[i].get_text() or ""
        if i == 0 or _looks_like_title_page(text):
            nums.extend(
                _collect_revision_numbers_from_text(
                    text, labels=True, table_rows=True,
                ),
            )
            nums.extend(_collect_revision_from_title_izm_table(text))

    # 2) Штамп: «N - Зам.» / блок «Изм. Кол…Дата» (без find_tables — медленно)
    scored = [(i, _page_score(doc[i])) for i in range(doc.page_count)]
    for i, sc in sorted(scored, key=lambda t: -t[1])[:8]:
        if sc <= 0:
            continue
        text = doc[i].get_text() or ""
        m_hdr = re.search(
            r"Изм\.?\s*Кол[^\n]{0,80}Дата.{0,500}",
            text,
            re.IGNORECASE | re.DOTALL,
        )
        if m_hdr:
            nums.extend(
                _collect_revision_numbers_from_text(
                    m_hdr.group(0), labels=False, table_rows=True,
                ),
            )
            nums.extend(_collect_revision_from_title_izm_table(m_hdr.group(0)))
        elif re.search(r"\d\s*[-–—]\s*Зам", text, re.I):
            nums.extend(
                _collect_revision_numbers_from_text(
                    text, labels=False, table_rows=True,
                ),
            )

    # 3) Медленный fallback: find_tables только первая страница титула
    if not nums and doc.page_count:
        nums.extend(_pick_revision_from_tables(doc[0]))

    if not nums:
        return ""
    return str(max(nums))


# ---------------------------------------------------------------------------
# OCR fallback for scanned (image-only) PDFs.
# Многие чертежи приходят как скан без текстового слоя — get_text() пуст,
# фамилии/роли достать нечем. Тогда рендерим область штампа и прогоняем OCR
# (MuPDF+Tesseract, рус. модель), затем разбираем строки «роль — фамилия».
# ---------------------------------------------------------------------------

# Страница считается «без текста», если полезного текста меньше этого порога.
_OCR_MIN_CHARS_PER_PAGE = 20

# Правила распознавания роли в OCR-строке штампа (метка → каноническое имя).
_OCR_ROLE_RULES: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("Разработал", re.compile(r"разраб", re.IGNORECASE)),
    ("Проверил", re.compile(r"провер", re.IGNORECASE)),
    ("Н. контр.", re.compile(r"н\W{0,3}контр|нормоконтр|^к\W{0,3}контр", re.IGNORECASE)),
    ("ГИП", re.compile(r"\bгип\b|гип", re.IGNORECASE)),
    ("Согласовано", re.compile(r"согласов", re.IGNORECASE)),
    ("Составил", re.compile(r"состав", re.IGNORECASE)),
    ("Утв.", re.compile(r"утверд|^утв\b", re.IGNORECASE)),
    ("Зам. нач. отд.", re.compile(r"зам\W{0,4}нач", re.IGNORECASE)),
)
_OCR_SURNAME_STOP = _SURNAME_STOP | frozenset(
    {
        "тип",
        "длина",
        "плита",
        "шов",
        "автостоянка",
        "моспроект",
        "жилой",
        "секция",
        "формат",
        "стадия",
        "нов",
        "зам",
        "общие",
        "данные",
        # Слова из наименования/объекта, затекающие в строку роли при OCR:
        "система",
        "системы",
        "водоснабжения",
        "водоотведения",
        "отопления",
        "вентиляции",
        "канализации",
        "электроснабжения",
        "решения",
        "конструкции",
        "перекрытия",
        "подвал",
        "этаж",
        "квартиры",
        "территории",
        "документация",
        "здания",
        "обозначение",
        "наименование",
        "утверждаю",
        "согласовано",
    },
)
# Типичные фамильные окончания — в приоритете при выборе фамилии из OCR-строки.
_SURNAME_SUFFIX_RE = re.compile(
    r"(?:ов|ев|ёв|ин|ын|ский|цкий|ской|цкой|ко|ук|юк|як|ян|ич|швили|дзе|"
    r"ова|ева|ёва|ина|ына|ская|цкая|их|ых|енко|чук)$",
    re.IGNORECASE,
)
_OCR_DATE_RE = re.compile(r"(\d{1,2})[.,](\d{1,2})[.,](\d{2,4})")


def _resolve_tessdata_dir() -> str | None:
    """Найти папку tessdata с рабочей русской моделью (rus.traineddata)."""
    candidates = [
        os.environ.get("DOCSAAS_TESSDATA"),
        os.environ.get("TESSDATA_PREFIX"),
        # портативная модель рядом с бэкендом (для prod/VPS)
        str(Path(__file__).resolve().parents[2] / "ocr" / "tessdata"),
        # tessdata, которые часто уже стоят на рабочих станциях
        r"C:\Program Files\Common Files\Tracker Software\Common\Tesseract",
        r"C:\Program Files\Tesseract-OCR\tessdata",
        r"C:\Program Files (x86)\Tesseract-OCR\tessdata",
    ]
    for d in candidates:
        if not d:
            continue
        f = Path(d) / "rus.traineddata"
        try:
            if f.is_file() and f.stat().st_size > 0:
                return str(d)
        except OSError:
            continue
    return None


_TESSDATA_DIR = _resolve_tessdata_dir()


def ocr_available() -> bool:
    """Доступен ли OCR (есть рабочая русская модель)."""
    return _TESSDATA_DIR is not None


def _doc_is_scanned(doc: pymupdf.Document) -> bool:
    """True, если у документа нет текстового слоя (скан из картинок)."""
    pages = min(doc.page_count, 6)
    if not pages:
        return False
    for i in range(pages):
        if len((doc[i].get_text() or "").strip()) >= _OCR_MIN_CHARS_PER_PAGE:
            return False
    return True


def _text_is_garbled(text: str) -> bool:
    """Текст есть, но это «каша» из-за битой кодировки шрифта (нет ToUnicode).

    Такие PDF визуально нормальные (глиф кириллический), но get_text() отдаёт
    коды из Latin Extended-B / IPA / управляющих — читать их нельзя, нужен OCR.
    """
    non_space = [c for c in text if not c.isspace()]
    if len(non_space) < 40:
        return False
    susp = 0
    for c in non_space:
        o = ord(c)
        if (0x0180 <= o <= 0x02FF) or (0x0001 <= o <= 0x0008) or (0x000E <= o <= 0x001F):
            susp += 1
    return susp / len(non_space) > 0.4


def _doc_text_is_garbled(doc: pymupdf.Document) -> bool:
    """True, если во всех текстовых страницах текстовый слой — «каша»."""
    pages = min(doc.page_count, 6)
    checked = 0
    garbled = 0
    for i in range(pages):
        text = doc[i].get_text() or ""
        if len([c for c in text if not c.isspace()]) < 40:
            continue
        checked += 1
        if _text_is_garbled(text):
            garbled += 1
    return checked > 0 and garbled == checked


def _ocr_clean_line(line: str) -> str:
    return re.sub(r"\s+", " ", line).strip(" |[]_—-=©#^·.")


def _ocr_role_of(line: str) -> str | None:
    """Метка роли в начале OCR-строки (чтобы не ловить роль в прозе примечаний)."""
    head = _ocr_clean_line(line).lower().replace("ё", "е")[:18]
    for canon, rx in _OCR_ROLE_RULES:
        if rx.search(head):
            return canon
    return None


def _ocr_first_surname(text: str) -> str:
    cands: list[str] = []
    for m in re.finditer(r"[А-ЯЁ][А-Яа-яЁё-]{2,29}", text):
        w = m.group(0)
        if w.lower().replace("ё", "е") in _OCR_SURNAME_STOP:
            continue
        if not re.search(r"[аеиоуыэюяё]", w, re.IGNORECASE):
            continue  # без гласной — не фамилия
        cands.append(w)
    if not cands:
        return ""
    # Предпочитаем слово с фамильным окончанием (отсекаем «Системы» и пр.).
    for w in cands:
        if _SURNAME_SUFFIX_RE.search(w):
            return w
    return cands[0]


def _ocr_date(text: str) -> str:
    m = _OCR_DATE_RE.search(text)
    if not m:
        return ""
    d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
    if y < 100:
        y += 2000
    if not (1 <= mo <= 12 and 1 <= d <= 31):
        return ""
    return f"{y:04d}-{mo:02d}-{d:02d}"


def _parse_stamp_ocr_lines(text: str) -> list[StampSignature]:
    """Разобрать OCR-текст штампа в список (роль, фамилия, дата)."""
    lines = [_ocr_clean_line(l) for l in text.splitlines()]
    # Блок подписантов начинается со строки «Разработал».
    start = 0
    for i, l in enumerate(lines):
        if re.search(r"разраб", l, re.IGNORECASE):
            start = i
            break
    block = lines[start:]

    out: list[StampSignature] = []
    seen: set[tuple[str, str]] = set()
    i = 0
    while i < len(block):
        line = block[i]
        role = _ocr_role_of(line)
        if role:
            mrole = _OCR_ROLE_RULES_DICT[role].search(line)
            after = line[mrole.end():] if mrole else line
            # дорезать остаток слова самой роли (…«отал» из «Разработал»)
            after = re.sub(r"^[А-Яа-яЁёA-Za-z.]*", "", after)
            surname = _ocr_first_surname(after)

            def _row_date(s: str) -> str:
                # Не путать дату подписания со штампом «Время печати: …».
                if re.search(r"печат|время", s, re.IGNORECASE):
                    return ""
                return _ocr_date(s)

            date = _row_date(line)
            # фамилия/дата могут быть на следующей строке (ячейка штампа)
            j = i
            while (not surname or not date) and j + 1 < len(block) and j - i < 2:
                j += 1
                nxt = block[j]
                if _ocr_role_of(nxt):
                    break
                if not surname:
                    surname = _ocr_first_surname(nxt)
                if not date:
                    date = _row_date(nxt)
            if surname:
                key = (_norm_role(role).lower(), surname.lower().replace("ё", "е"))
                if key not in seen:
                    seen.add(key)
                    out.append(
                        StampSignature(role=role, surname=surname, signed_at=date),
                    )
        i += 1
    return out


_OCR_ROLE_RULES_DICT = {canon: rx for canon, rx in _OCR_ROLE_RULES}


def _ocr_region_text(page: pymupdf.Page, clip: pymupdf.Rect, scale: float) -> str:
    """OCR произвольной области листа → текст (пусто, если OCR недоступен)."""
    pix = page.get_pixmap(matrix=pymupdf.Matrix(scale, scale), clip=clip)
    try:
        pdfbytes = pix.pdfocr_tobytes(language="rus")
    except Exception:  # noqa: BLE001 — OCR может быть недоступен в рантайме
        return ""
    ocr_doc = pymupdf.open("pdf", pdfbytes)
    try:
        return ocr_doc.load_page(0).get_text() or ""
    finally:
        ocr_doc.close()


def _ocr_stamp_text(page: pymupdf.Page, scale: float = 6.0) -> str:
    """OCR правого-нижнего угла листа (область штампа ГОСТ)."""
    rect = page.rect
    clip = pymupdf.Rect(
        rect.x0 + rect.width * 0.46,
        rect.y0 + rect.height * 0.64,
        rect.x1,
        rect.y1,
    )
    return _ocr_region_text(page, clip, scale)


def _ocr_title_text(doc: pymupdf.Document) -> str:
    """OCR титульного листа (обычно первый портретный лист с «документац»)."""
    for i in range(min(doc.page_count, 2)):
        page = doc[i]
        r = page.rect
        if r.width <= r.height:
            text = _ocr_region_text(page, r, 3.0)
            if "документац" in text.lower():
                return text
    if doc.page_count:
        return _ocr_region_text(doc[0], doc[0].rect, 3.0)
    return ""


def _lev(a: str, b: str) -> int:
    """Расстояние Левенштейна (для схлопывания OCR-разночтений фамилий)."""
    if a == b:
        return 0
    la, lb = len(a), len(b)
    if not la or not lb:
        return la or lb
    prev = list(range(lb + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[lb]


def _surname_similar(a: str, b: str) -> bool:
    na = a.lower().replace("ё", "е")
    nb = b.lower().replace("ё", "е")
    if na == nb:
        return True
    if abs(len(na) - len(nb)) > 2:
        return False
    return _lev(na, nb) <= max(1, min(len(na), len(nb)) // 4)


def _ocr_merge_signatures(
    parses: list[list[StampSignature]],
) -> list[StampSignature]:
    """Слить разборы нескольких листов: внутри роли — мажоритарное написание.

    OCR на разных листах читает одну фамилию по-разному (Гужова/Гужоба/Гужода).
    Группируем похожие и берём самое частое написание → гасим ошибки.
    """
    from collections import Counter

    role_order: list[str] = []
    role_surnames: dict[str, list[str]] = {}
    role_dates: dict[str, list[tuple[str, str]]] = {}
    for parse in parses:
        for s in parse:
            if s.role not in role_surnames:
                role_surnames[s.role] = []
                role_order.append(s.role)
            role_surnames[s.role].append(s.surname)
            role_dates.setdefault(s.role, []).append((s.surname, s.signed_at))

    out: list[StampSignature] = []
    for role in role_order:
        clusters: list[dict] = []
        for sur in role_surnames[role]:
            for c in clusters:
                if _surname_similar(sur, c["key"]):
                    c["counter"][sur] += 1
                    break
            else:
                clusters.append({"key": sur, "counter": Counter([sur])})
        for c in clusters:
            best = c["counter"].most_common(1)[0][0]
            date = ""
            for sur, d in role_dates[role]:
                if d and _surname_similar(sur, best):
                    date = d
                    break
            out.append(StampSignature(role=role, surname=best, signed_at=date))
    return out


def _ocr_doc_name(text: str) -> str:
    """Бережно вытащить наименование документа из OCR-текста штампа.

    Ищем только в блоке подписантов (после «Разработал»), чтобы не схватить
    примечание из верхней части листа; берём лишь «чистую» строку.
    """
    kw = re.compile(
        r"плит|перекрыт|фундамент|ростверк|стен|колонн|балк|лестниц|"
        r"армирован|узл|схема|ведомост|план|разрез|констру|секци",
        re.IGNORECASE,
    )
    lines = [_ocr_clean_line(l) for l in text.splitlines()]
    start = 0
    for i, l in enumerate(lines):
        if re.search(r"разраб", l, re.IGNORECASE):
            start = i
            break
    for line in lines[start:]:
        if len(line) < 12 or len(line) > 160:
            continue
        if not re.match(r"^[А-ЯЁ]", line):  # наименование с заглавной
            continue
        if not kw.search(line):
            continue
        if _ocr_role_of(line) or _looks_like_doc_notes(line):
            continue
        digits = sum(c.isdigit() for c in line)
        if digits > len(line) * 0.5:
            continue
        return _normalize_doc_name_text(line)
    return ""


def _ocr_pick_pages(doc: pymupdf.Document, limit: int = 8) -> list[int]:
    """Листы-кандидаты со штампом: альбомные и крупные (без обложки/портрета).

    Выбираем РАВНОМЕРНО по всему документу: на разных листах OCR штампа
    получается с разным качеством (где-то метка «Разработал» читается, где-то
    бьётся сеткой), поэтому важно не ограничиваться первыми листами.
    """
    cands: list[int] = []
    for i in range(doc.page_count):
        r = doc[i].rect
        if r.width >= r.height and r.width * r.height > 500_000:
            cands.append(i)
    if not cands:  # запасной вариант — любые страницы
        cands = list(range(doc.page_count))
    if len(cands) <= limit:
        return cands
    step = len(cands) / limit
    return [cands[int(i * step)] for i in range(limit)]


def _ocr_fill_scanned(
    result: StampParseResult,
    doc: pymupdf.Document,
    *,
    extract_signatures: bool,
) -> None:
    """Заполнить подписи/наименование из скана через OCR области штампа."""
    if _TESSDATA_DIR:
        os.environ["TESSDATA_PREFIX"] = _TESSDATA_DIR
    _ = extract_signatures  # картинки подписей из скана не вырезаем

    # 1) Подписи: OCR нескольких листов + мажоритарное голосование по фамилиям
    #    (один и тот же набор подписантов повторяется на листах альбома; OCR
    #    читает фамилию по-разному — голосование выбирает верное написание).
    parses: list[list[StampSignature]] = []
    pages_used: list[int] = []
    best_stamp_text = ""
    best_sig_count = -1
    for page_index in _ocr_pick_pages(doc, limit=8):
        text = _ocr_stamp_text(doc[page_index])
        if not text:
            continue
        sigs = _parse_stamp_ocr_lines(text)
        if sigs:
            parses.append(sigs)
            pages_used.append(page_index + 1)
            if len(sigs) > best_sig_count:
                best_sig_count = len(sigs)
                best_stamp_text = text
        # Ранний стоп — только когда собран ПОЛНЫЙ штамп (все 4 роли). Иначе
        # легко потерять лист с редкой ролью (ГИП/Разработал читается не везде).
        all_roles = {
            _norm_role(s.role).lower().replace("ё", "е")
            for p in parses
            for s in p
        }
        have = {
            "разраб": any("разраб" in r for r in all_roles),
            "провер": any("провер" in r for r in all_roles),
            "гип": any(r == "гип" for r in all_roles),
            "контр": any("контр" in r for r in all_roles),
        }
        if all(have.values()) and len(parses) >= 2:
            break
        if len(parses) >= 6:  # бюджет голосов
            break
    if parses:
        result.signatures.extend(_ocr_merge_signatures(parses))
        if pages_used:
            result.source_page = pages_used[0]

    # 2) Наименование документа и объект — с титульного листа (OCR).
    title_text = _ocr_title_text(doc)
    if not result.doc_name and title_text:
        name = _normalize_doc_name_text(
            _pick_doc_name_between_doctype_and_cipher(title_text),
        )
        if name and not _looks_like_doc_notes(name) and not _weak_filename_doc_name(name):
            result.doc_name = name
    if not result.doc_name and best_stamp_text:
        result.doc_name = _ocr_doc_name(best_stamp_text)  # запасной источник
    if not result.object_name and title_text:
        m = re.search(
            r"ОБЪЕКТ[:\s]+(.+?)(?:Рабочая документац|Проектная документац|$)",
            title_text,
            re.S | re.IGNORECASE,
        )
        if m:
            obj = re.sub(r"\s+", " ", m.group(1)).strip(" «».\"")
            if 8 <= len(obj) <= 400:
                result.object_name = obj

    if result.signatures:
        result.warnings.append(
            "Штамп распознан через OCR — проверьте фамилии и наименование.",
        )
    else:
        result.warnings.append(
            "Штамп с ролями не распознан OCR. Заполните подписи вручную.",
        )


def _native_result_weak(result: StampParseResult) -> bool:
    """Нативный разбор слаб: штамп нарисован контурами (CAD), текст его не видит.

    Признак неполноты — среди распознанных текстом ролей нет НИ «Разработал»,
    НИ «Проверил» (это основные графы штампа формы 1). Так бывает на листах-
    продолжениях (форма 3: «Изм. внёс / ГИП / Утверждаю») и на векторных
    штампах. Тогда включаем OCR-резерв. Если хотя бы одна из основных ролей
    найдена текстом — нативный разбор считаем годным (быстрый путь, без OCR).
    """
    roles = [_norm_role(s.role).lower().replace("ё", "е") for s in result.signatures]
    has_core = any(("разраб" in r) or ("провер" in r) for r in roles)
    return not has_core


def analyze_stamp_pdf(
    data: bytes,
    filename: str | None = None,
    *,
    extract_signatures: bool = True,
) -> StampParseResult:
    result = StampParseResult()
    fn_des, fn_name, fn_ver = _filename_hints(filename)
    # Версию из имени файла не ставим (будет с титула/таблицы Изм.).
    _ = fn_ver
    if fn_des:
        result.doc_designation = fn_des
    # Имя из файла — только временный fallback; титул перезапишет.
    # Шифро-хвосты вроде «АР1.2 ИЗМ3» не считаем наименованием раздела.
    if (
        fn_name
        and fn_name.lower().replace("ё", "е") not in _SHEET_ONLY_NAMES
        and not _weak_filename_doc_name(fn_name)
    ):
        result.doc_name = _normalize_doc_name_text(fn_name)

    try:
        doc = pymupdf.open(stream=data, filetype="pdf")
    except Exception as exc:  # noqa: BLE001
        result.warnings.append(f"Не удалось открыть PDF: {exc}")
        return result

    try:
        # Скан без текста ИЛИ битый текстовый слой (шрифт без ToUnicode —
        # get_text отдаёт «кашу») → один путь: OCR области штампа/титула.
        scanned = _doc_is_scanned(doc)
        garbled = (not scanned) and _doc_text_is_garbled(doc)
        if scanned or garbled:
            if ocr_available():
                _ocr_fill_scanned(
                    result, doc, extract_signatures=extract_signatures,
                )
            elif scanned:
                result.warnings.append(
                    "PDF — скан без текстового слоя, а OCR недоступен "
                    "(нет русской модели Tesseract). Поля — из имени файла; "
                    "подписи заполните вручную.",
                )
            else:
                result.warnings.append(
                    "Текстовый слой PDF повреждён (шрифт без ToUnicode), "
                    "а OCR недоступен. Поля — из имени файла; "
                    "подписи и наименование заполните вручную.",
                )
            # Версия = номер изменения из обозначения («… (Изм. 3)» → «3»).
            if not result.doc_version and result.doc_designation:
                mver = re.search(r"Изм\.?\s*(\d+)", result.doc_designation, re.I)
                if mver:
                    result.doc_version = mver.group(1)
            if result.doc_designation:
                base_des = re.sub(
                    r"\s*\(?\s*Изм\.?\s*\d+\s*\)?",
                    "",
                    result.doc_designation,
                    flags=re.I,
                ).strip()
                result.ul_code = f"{(base_des or result.doc_designation)}_УЛ"
            return result

        # Приоритет: наименование с титульного листа
        title_name = _normalize_doc_name_text(_pick_doc_name_from_title_pages(doc))
        if title_name and not _weak_filename_doc_name(title_name):
            result.doc_name = title_name
        elif result.doc_name:
            result.doc_name = _normalize_doc_name_text(result.doc_name)
            if _weak_filename_doc_name(result.doc_name):
                result.doc_name = ""

        # Версия = последний номер изменения (таблица / «Изм. N»)
        rev = _pick_revision_version(doc)
        if rev:
            result.doc_version = rev

        scored = [(i, _page_score(doc[i])) for i in range(doc.page_count)]
        scored_desc = sorted(scored, key=lambda t: -t[1])
        stamp_pages = [i for i, sc in scored if sc > 0]
        if not stamp_pages:
            result.warnings.append(
                "Штамп с ролями (Разработал/Проверил) не найден — заполнены поля из имени файла.",
            )
            if result.doc_designation:
                base_des = re.sub(
                    r"\s*\(?\s*Изм\.?\s*\d+\s*\)?",
                    "",
                    result.doc_designation,
                    flags=re.I,
                ).strip()
                result.ul_code = f"{(base_des or result.doc_designation)}_УЛ"
            return result

        # Meta (шифр) — с лучшей по score страницы штампа.
        best_index = scored_desc[0][0]
        best_page = doc[best_index]
        result.source_page = best_index + 1
        best_words = _words(best_page)

        designation = _pick_designation(best_words) or result.doc_designation
        designation = _prefer_designation(designation, fn_des)
        if designation:
            # Если из имени файла был суффикс Изм. — дописываем к шифру со штампа.
            izm_from_fn = ""
            if filename:
                izm_from_fn, _ = _izm_suffix_from_name(Path(filename).stem)
            if izm_from_fn and izm_from_fn.strip() not in designation:
                designation = designation.rstrip() + izm_from_fn
            result.doc_designation = designation

        # For object heuristics use a designation fragment present on the page
        des_for_layout = designation
        core_des = re.sub(
            r"\s*\(?\s*Изм\.?\s*\d+\s*\)?",
            "",
            designation or "",
            flags=re.I,
        ).strip()
        page_join = "".join(w[4] for w in best_words)
        if core_des and core_des not in page_join.replace(" ", ""):
            parts = core_des.split("-")
            for k in range(len(parts), 1, -1):
                prefix = "-".join(parts[:k])
                if any(prefix in w[4] or w[4].startswith(prefix[:8]) for w in best_words):
                    des_for_layout = prefix
                    break

        object_name, _sheet_ignored = _pick_object_and_sheet_name(
            best_words, des_for_layout,
        )
        if object_name:
            result.object_name = object_name

        # doc_name: титул; если примечания/мусор — имя из файла
        if result.doc_name:
            result.doc_name = _normalize_doc_name_text(result.doc_name)
        if result.doc_name and (
            _looks_like_doc_notes(result.doc_name)
            or _weak_filename_doc_name(result.doc_name)
        ):
            result.doc_name = ""
        if not result.doc_name and fn_name:
            fn_clean = _normalize_doc_name_text(fn_name)
            if (
                fn_clean.lower().replace("ё", "е") not in _SHEET_ONLY_NAMES
                and not _looks_like_doc_notes(fn_clean)
                and not _weak_filename_doc_name(fn_clean)
            ):
                result.doc_name = fn_clean
        if result.doc_name and DESIGNATION_RE.fullmatch(
            result.doc_name.replace(" ", ""),
        ):
            result.doc_name = (
                fn_name
                if fn_name
                and fn_name != result.doc_name
                and fn_name.lower().replace("ё", "е") not in _SHEET_ONLY_NAMES
                and not _looks_like_doc_notes(fn_name)
                and not _weak_filename_doc_name(fn_name)
                else ""
            )
        if result.doc_name and result.doc_name.lower().replace("ё", "е") in _SHEET_ONLY_NAMES:
            result.doc_name = ""
            if title_name and not _looks_like_doc_notes(title_name) and not _weak_filename_doc_name(title_name):
                result.doc_name = title_name
            elif (
                fn_name
                and fn_name.lower().replace("ё", "е") not in _SHEET_ONLY_NAMES
                and not _looks_like_doc_notes(fn_name)
                and not _weak_filename_doc_name(fn_name)
            ):
                result.doc_name = fn_name
        if result.doc_name and (
            _looks_like_doc_notes(result.doc_name)
            or _weak_filename_doc_name(result.doc_name)
        ):
            result.doc_name = (
                fn_name
                if fn_name
                and not _looks_like_doc_notes(fn_name)
                and not _weak_filename_doc_name(fn_name)
                else ""
            )
        # Финальная нормализация
        if result.doc_name:
            result.doc_name = _normalize_doc_name_text(result.doc_name)

        # Title page may have ОБЪЕКТ: ...
        if not result.object_name:
            for i in range(min(2, doc.page_count)):
                t = doc[i].get_text() or ""
                m = re.search(
                    r"ОБЪЕКТ:\s*(.+?)(?:Рабочая документация|Проектная документация|Рабочая|$)",
                    t,
                    re.DOTALL | re.IGNORECASE,
                )
                if m:
                    result.object_name = re.sub(r"\s+", " ", m.group(1)).strip(" «»\"")
                    break

        # Все листы со штампом: объединяем максимальный список подписантов.
        # Ключ — (роль, фамилия); новая фамилия на любом листе попадает в список.
        seen: set[tuple[str, str]] = set()
        role_names = {_norm_role(r).lower().replace("ё", "е") for r in ROLE_PATTERNS}
        cropped = 0
        pages_with_names: list[int] = []

        for page_index in stamp_pages:
            page = doc[page_index]
            words = _words(page)
            roles = _find_roles_on_page(words)
            page_added = False
            for role_box in sorted(roles, key=lambda r: r[1]):
                role = role_box[4]
                surname, signed_at = _surname_right_of(words, role_box)
                if not surname:
                    continue
                sur_key = surname.strip().lower().replace("ё", "е")
                # Отсекаем мусор: когда в колонку фамилии попало название роли
                if sur_key in role_names or sur_key == _norm_role(role).lower().replace("ё", "е"):
                    continue
                key = (_norm_role(role).lower(), sur_key)
                if key in seen:
                    continue
                seen.add(key)
                page_added = True
                png_b64 = ""
                if extract_signatures:
                    png_b64 = _crop_signature_png(page, words, role_box, surname)
                    if png_b64:
                        cropped += 1
                result.signatures.append(
                    StampSignature(
                        role=role,
                        surname=surname,
                        signed_at=signed_at,
                        signature_png_base64=png_b64,
                    ),
                )
            if page_added:
                pages_with_names.append(page_index + 1)

        if pages_with_names:
            result.source_page = pages_with_names[0]
            if len(pages_with_names) > 1:
                result.warnings.append(
                    f"Подписанты собраны со стр. {', '.join(map(str, pages_with_names))} "
                    f"({len(result.signatures)} фам.).",
                )

        if not result.signatures:
            result.warnings.append("Роли в штампе найдены, но фамилии не сопоставлены.")
        elif extract_signatures and cropped == 0:
            result.warnings.append(
                "Фамилии найдены, но картинки подписей из колонки «Подп.» вырезать не удалось.",
            )
        elif extract_signatures and cropped < len(result.signatures):
            result.warnings.append(
                f"Вырезано подписей: {cropped} из {len(result.signatures)}.",
            )

        # Универсальный считыватель: если штамп нарисован контурами (CAD-экспорт)
        # и нативный текст дал слабый результат — добираем OCR-резервом.
        if ocr_available() and _native_result_weak(result):
            native_sigs = list(result.signatures)
            native_name = result.doc_name
            native_obj = result.object_name
            result.signatures = []
            result.doc_name = ""
            result.object_name = ""
            _ocr_fill_scanned(result, doc, extract_signatures=extract_signatures)
            if not result.signatures:
                result.signatures = native_sigs
            if not result.doc_name:
                result.doc_name = native_name
            if not result.object_name:
                result.object_name = native_obj

        # Версия = номер изменения из обозначения («… (Изм. 3)» → «3»),
        # если в тексте/таблице её не нашли.
        if not result.doc_version and result.doc_designation:
            mver = re.search(r"Изм\.?\s*(\d+)", result.doc_designation, re.I)
            if mver:
                result.doc_version = mver.group(1)

        if result.doc_designation:
            base_des = re.sub(r"\s*\(?\s*Изм\.?\s*\d+\s*\)?", "", result.doc_designation, flags=re.I).strip()
            result.ul_code = f"{(base_des or result.doc_designation)}_УЛ"
        # Пустая версия остаётся пустой — в бланке ИУЛ будет «-»
    finally:
        doc.close()

    return result


def result_to_dict(result: StampParseResult) -> dict:
    return {
        "object_name": result.object_name,
        "doc_designation": result.doc_designation,
        "doc_name": result.doc_name,
        "doc_version": result.doc_version,
        "ul_code": result.ul_code,
        "signatures": [
            {
                "role": s.role,
                "surname": s.surname,
                "signed_at": s.signed_at,
                "signature_png_base64": s.signature_png_base64 or None,
            }
            for s in result.signatures
        ],
        "source_page": result.source_page,
        "warnings": result.warnings,
    }
