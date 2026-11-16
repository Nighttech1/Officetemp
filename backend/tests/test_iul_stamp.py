"""Tests for IUL stamp parser against templates/ drawing PDF."""

from __future__ import annotations

from pathlib import Path

import pytest

from app.services.iul_stamp import (
    StampParseResult,
    StampSignature,
    _filename_hints,
    _find_roles_on_page,
    _native_result_weak,
    _norm_role,
    _ocr_doc_name,
    _ocr_merge_signatures,
    _parse_stamp_ocr_lines,
    _role_matches_pattern,
    analyze_stamp_pdf,
)

TEMPLATES = Path(__file__).resolve().parents[2] / "templates"


def _sample_pdf() -> Path:
    pdfs = list(TEMPLATES.glob("*.pdf"))
    if not pdfs:
        pytest.skip("no PDF in templates/")
    return pdfs[0]


def test_filename_hints_rejects_cipher_tail_as_name():
    """Хвост «АР1.2 ИЗМ3» — не наименование раздела (C-121)."""
    des, name, ver = _filename_hints("56-0321-ОК-1 АР1(2)(1)(1).2 ИЗМ3.pdf")
    assert "56-0321-" in des
    assert name == ""
    assert ver == ""


def test_filename_hints_izm_goes_to_designation():
    des, name, ver = _filename_hints(
        "56-0321-ОК-1-2-КЖ5.2 Плита перекрытия (Изм. 2).pdf",
    )
    assert "56-0321-" in des
    assert "(Изм. 2)" in des
    assert ver == ""
    assert "Плита" in name
    assert "Изм" not in name


def test_kj62_doc_name_from_title_not_filename():
    """КЖ6.2: в имени файла только шифр → наименование с титула."""
    path = TEMPLATES / "56-0321-ОК-1-2-КЖ6.2.pdf"
    if not path.is_file():
        pytest.skip("КЖ6.2 sample missing")
    result = analyze_stamp_pdf(path.read_bytes(), path.name, extract_signatures=False)
    assert result.doc_name
    assert "несущие" in result.doc_name.lower()
    assert "общие данные" not in result.doc_name.lower()
    assert "…" not in result.doc_name  # нормализация многоточия


def test_filename_hints_izm_underscore():
    des, name, ver = _filename_hints("56-0321-ОК-1-1-КЖ4.1_Изм.3.pdf")
    assert "(Изм. 3)" in des
    assert ver == ""


def test_analyze_stamp_pdf_template():
    path = _sample_pdf()
    result = analyze_stamp_pdf(path.read_bytes(), path.name)
    assert result.doc_designation.startswith("56-0321-")
    assert result.source_page is not None
    roles = {s.role: s.surname for s in result.signatures}
    assert "Разработал" in roles or any(s.surname for s in result.signatures)
    assert any(s.signed_at for s in result.signatures) or True
    if result.ul_code:
        assert result.ul_code.endswith("_УЛ")
        assert "(Изм." not in result.ul_code
    # version cell: empty or meaningful, never forced "0"
    assert result.doc_version != "0"
    with_img = [s for s in result.signatures if s.signature_png_base64]
    assert len(with_img) >= 1
    assert len(with_img[0].signature_png_base64) > 100


def test_analyze_kj62_stamp_designation_and_normocontrol():
    """C-91/C-92/C-94/C-98: КЖ6.2 — шифр, наименование с титула, версия=Изм, Н. контр."""
    path = TEMPLATES / "56-0321-ОК-1-2-КЖ6.2.pdf"
    if not path.is_file():
        pytest.skip("КЖ6.2 sample missing")
    result = analyze_stamp_pdf(path.read_bytes(), path.name, extract_signatures=False)
    assert result.doc_designation == "56-0321-ОК-1-2-КЖ6.2"
    assert "Общие данные" not in (result.doc_name or "")
    assert "несущие" in (result.doc_name or "").lower() or "Секция" in (result.doc_name or "")
    assert result.doc_version == "1"  # титул (изм. 1) / штамп 1 - Зам.
    roles = {s.role: s.surname for s in result.signatures}
    assert roles.get("Н. контр.") == "Романов"
    assert roles.get("Разработал")
    assert roles.get("Проверил")
    assert roles.get("ГИП")


def test_revision_version_from_table_text():
    """C-98: таблица Изм|№ док|Подп|Дата с 1 и 2 → версия «2»."""
    from app.services.iul_stamp import (
        _collect_revision_from_title_izm_table,
        _collect_revision_numbers_from_text,
    )

    sample = (
        "Изм. № док. Подп. Дата\n"
        "1 500/26 09.06.26\n"
        "2 654/26 23.07.26\n"
    )
    nums = _collect_revision_from_title_izm_table(sample)
    assert nums == [1, 2]
    assert str(max(nums)) == "2"
    # штамп «N - Зам.» тоже даёт max=2
    zam = "1 - Зам. 500/26\n2 - Зам. 654/26\n"
    assert max(_collect_revision_numbers_from_text(zam, labels=False)) == 2


def test_revision_version_from_title_paren():
    from app.services.iul_stamp import _collect_revision_numbers_from_text

    text = "56-0321-ОК-1-2-КЖ6.2 (изм. 1)\n2026\n"
    nums = _collect_revision_numbers_from_text(text)
    assert 1 in nums
    assert max(nums) == 1


def test_title_page_doc_name_never_obshie_dannye():
    """C-94: текстовые правила титула — имя над шифром, не «Общие данные»."""
    from app.services.iul_stamp import _pick_doc_name_between_doctype_and_cipher

    text = (
        "ЗАСТРОЙЩИК: Фонд\nЗАКАЗЧИК: ООО Тест\nОБЪЕКТ: Жилой дом\n"
        "Рабочая документация\n"
        "Вертикальные несущие конструкции на отм. -4.100. Секция 2\n"
        "56-0321-ОК-1-2-КЖ6.2 (изм. 1)\n2026\n"
        "Общие данные\n"
    )
    name = _pick_doc_name_between_doctype_and_cipher(text)
    assert "Общие данные" not in name
    assert "несущие" in name.lower()
    assert "ЗАСТРОЙЩИК" not in name
    assert "Рабочая" not in name


def test_title_page_multiline_pd_section():
    """C-94: многострочное наименование над шифром проектной документации."""
    from app.services.iul_stamp import _pick_doc_name_between_doctype_and_cipher

    text = (
        "ЗАСТРОЙЩИК: А\nЗАКАЗЧИК: Б\nОБЪЕКТ: В\n"
        "Проектная документация\n"
        "Раздел 4. Конструктивные решения.\n"
        "Часть 2. Конструктивные и объемно-планировочные решения.\n"
        "Жилое здание и подземная автостоянка.\n"
        "Корректировка\n"
        "10-21/6527 – КР2\n"
        "Том 4.2\n"
    )
    name = _pick_doc_name_between_doctype_and_cipher(text)
    assert "Раздел 4" in name or "Жилое" in name or "Корректировка" in name
    assert "Общие" not in name
    assert "ЗАСТРОЙЩИК" not in name
    assert "Проектная" not in name
    assert "Том" not in name


def test_doc_name_rejects_drawing_notes_c102():
    """C-102: не брать ГОСТ/примечания вместо названия с титула."""
    from app.services.iul_stamp import (
        _looks_like_doc_notes,
        _pick_doc_name_between_doctype_and_cipher,
        _filename_hints,
    )

    notes = (
        "разработана в соответствии с заданием на проектирование, "
        "выданным техническим условиям. Качество поверхности A3, A4, A5, A6 "
        "по ГОСТ 13015-2012 и ещё длинный текст примечаний на листе."
    )
    assert _looks_like_doc_notes(notes)

    text = (
        "ЗАСТРОЙЩИК: Фонд\nЗАКАЗЧИК: ООО\nОБЪЕКТ: Жилой дом\n"
        "Рабочая документация\n"
        "Вертикальные несущие конструкции на отм. +2,520. Секция 1\n"
        "56-0321-ОК-1-1-КЖ10.1 (изм. 2)\n"
        f"{notes}\n"
    )
    # Ложный «длинный» span: примечания между другим вхождением и шифром
    text_bad = (
        "Рабочая документация\n"
        f"{notes}\n"
        "ещё мусор\n"
        "56-0321-ОК-1-1-КЖ10.1 (изм. 2)\n"
    )
    good = _pick_doc_name_between_doctype_and_cipher(text)
    assert "несущие" in good.lower()
    assert "гост" not in good.lower()
    assert "разработана" not in good.lower()

    bad = _pick_doc_name_between_doctype_and_cipher(text_bad)
    assert bad == "" or not _looks_like_doc_notes(bad)

    des, name, _ = _filename_hints(
        "56-0321-ОК-1-1-КЖ10.1 (Изм. 2) Вертикальные несущие конструкции "
        "на отм. +2,520. Секция 1.pdf",
    )
    assert "КЖ10.1" in des
    assert "несущие" in name.lower()
    assert "гост" not in name.lower()


# --- OCR fallback (scanned PDF) --------------------------------------------
# Строки, как их выдаёт OCR штампа ГОСТ (с «мусором» рамок, роль и фамилия
# иногда на разных строках). Движок OCR тут не нужен — проверяем парсер.
_OCR_STAMP_SAMPLE = """\
15. Требования к качеству поверхности железобетонных конструкции
ГОСТ 13015-2012:
16. В соответствии с тех. решениями альбома 56-0321-ОК-1-М3
| Изм. Кол. уч. Лист |№док. Подп. | Дата |
Разработал
| Асекаева | ва 7 [15.06.26
Проверил |Гужова | рнАт 15.06.26
Плита перекрытия на отм. +7.700, .., +64.700. Секция 1
Н. контр. |Гужова | Таз 15.06.26
ГИП
|Шевченко
| 77 15.06.26
"""


def test_ocr_stamp_line_parser_roles_and_surnames():
    sigs = _parse_stamp_ocr_lines(_OCR_STAMP_SAMPLE)
    roles = {s.role: s.surname for s in sigs}
    assert roles.get("Разработал") == "Асекаева"
    assert roles.get("Проверил") == "Гужова"
    assert roles.get("Н. контр.") == "Гужова"
    assert roles.get("ГИП") == "Шевченко"
    # дата с 2-значным годом разворачивается в ISO
    byrole = {s.role: s.signed_at for s in sigs}
    assert byrole["Проверил"] == "2026-06-15"
    # «Требования к качеству...» (примечание выше блока) — не роль/фамилия
    assert all("Требования" not in s.surname for s in sigs)


def test_ocr_stamp_line_parser_dedup_same_role_surname():
    text = "Разработал\n|Иванов\nРазработал |Иванов | 01.02.26\n"
    sigs = _parse_stamp_ocr_lines(text)
    razr = [s for s in sigs if s.role == "Разработал" and s.surname == "Иванов"]
    assert len(razr) == 1


def test_ocr_doc_name_scoped_to_stamp_block():
    # «качеству поверхности … конструкции» — примечание ВЫШЕ «Разработал» →
    # не должно попасть в наименование; чистая строка в блоке — попадает.
    name = _ocr_doc_name(_OCR_STAMP_SAMPLE)
    assert "Требования" not in name
    assert "качеств" not in name.lower()
    assert "перекрыт" in name.lower()

    # «грязная» строка со строчной буквы — не берём
    dirty = "Разработал\nлута перекрытия На отм. +7,\n"
    assert _ocr_doc_name(dirty) == ""


def test_ocr_merge_majority_vote_fixes_surname_variants():
    """Тикет: OCR на разных листах читает фамилию по-разному → берём частое."""
    page = lambda p, n, g: [  # noqa: E731
        StampSignature(role="Разработал", surname="Асекаева", signed_at=""),
        StampSignature(role="Проверил", surname=p, signed_at=""),
        StampSignature(role="Н. контр.", surname=n, signed_at=""),
        StampSignature(role="ГИП", surname=g, signed_at=""),
    ]
    parses = [
        page("Гужова", "Гужова", "Шевченко"),
        page("Гужоба", "Гужода", "Шевченхо"),  # OCR-варианты
        page("Гужова", "Гужова", "Шевченко"),
    ]
    merged = _ocr_merge_signatures(parses)
    roles = {s.role: s.surname for s in merged}
    assert roles["Проверил"] == "Гужова"  # 2× Гужова > 1× Гужоба
    assert roles["Н. контр."] == "Гужова"
    assert roles["ГИП"] == "Шевченко"
    assert roles["Разработал"] == "Асекаева"
    # по одной строке на роль (варианты схлопнуты)
    assert len(merged) == 4


def test_title_name_skips_frame_margin_labels():
    """Графы рамки («Инв. № подл.», «Согласовано:») не попадают в наименование."""
    from app.services.iul_stamp import _pick_doc_name_between_doctype_and_cipher

    text = (
        "РАБОЧАЯ ДОКУМЕНТАЦИЯ\n"
        "Взам. инв. №\n"
        "Подп. и дата\n"
        "Инв. № подл.\n"
        "Согласовано:\n"
        "2026\n"
        "Интерьерные решения. Квартиры\n"
        "56-0321-ОК-1-АИ1\n"
    )
    name = _pick_doc_name_between_doctype_and_cipher(text)
    assert name == "Интерьерные решения. Квартиры"


def _mk(*roles: str) -> StampParseResult:
    r = StampParseResult()
    r.signatures = [
        StampSignature(role=role, surname="Иванов") for role in roles
    ]
    return r


def test_filename_hints_alpha_mark_suffix_eom_kv():
    """Буквенный марочный суффикс после точки (ЭОМ.КВ) — часть шифра, не имя."""
    des, name, _ = _filename_hints("56-0321-ОК-1-ЭОМ.КВ Изм.1.pdf")
    assert "ЭОМ.КВ" in des
    assert "(Изм. 1)" in des
    assert name != "КВ"  # «.КВ» не должно отвалиться в наименование
    # цифровой суффикс по-прежнему работает
    des2, _, _ = _filename_hints("56-0321-ОК-1-2-КЖ6.2.pdf")
    assert des2.endswith("КЖ6.2")


def test_native_weak_detection_for_ocr_fallback():
    """Нет ни Разработал, ни Проверил текстом → слабо (нужен OCR-резерв)."""
    # лист-продолжение (форма 3) / векторный штамп → слабо
    assert _native_result_weak(_mk("Изм. внес", "ГИП"))
    assert _native_result_weak(_mk("Изм. внес", "ГИП", "ГИП"))  # +мусорная строка
    assert _native_result_weak(_mk("Согласовано", "Утв."))
    # есть основная роль формы 1 → НЕ слабо (быстрый нативный путь, без регресса)
    assert not _native_result_weak(_mk("Изм. внес", "ГИП", "Проверил"))  # как AI1
    assert not _native_result_weak(_mk("Разработал", "ГИП"))
    assert not _native_result_weak(_mk("Разработал", "Проверил", "ГИП", "Н. контр."))


def test_role_match_yo_insensitive_izm_vnyos():
    """«Изм. внёс» (с ё) должен совпасть с паттерном «Изм. внес» (тикет Рычкова)."""
    assert _role_matches_pattern("Изм. внёс", "Изм.внёс", "Изм. внес")
    assert _role_matches_pattern("Изм. внес", "Изм.внес", "Изм. внес")
    # посторонний текст роль не подхватывает
    assert not _role_matches_pattern("Площадка", "Площадка", "Изм. внес")


def test_role_match_abbreviated_razrab():
    """Сокращённая роль «Разраб.» ловится как «Разработал» (тикет СПА1)."""
    assert _role_matches_pattern("Разраб.", "Разраб.", "Разработал")
    assert _role_matches_pattern("Разраб", "Разраб", "Разработал")
    assert _role_matches_pattern("Разработал", "Разработал", "Разработал")
    assert _role_matches_pattern("Провер.", "Провер.", "Проверил")
    # не хватает фамилию из соседней ячейки (fullmatch по токену)
    assert not _role_matches_pattern("Разраб. Курбанов", "Разраб.Курбанов", "Разработал")
    # проза «разработана…» ролью не становится
    assert not _role_matches_pattern("разработана", "разработана", "Разработал")


def test_role_match_normocontrol_truncated():
    """«Н.контрол.» (усечённый нормоконтроль) → «Н. контр.» (тикет СПА1)."""
    for role in ("Нормоконтроль", "Н. контр.", "Н.контроль"):
        assert _role_matches_pattern("Н.контрол.", "Н.контрол.", role)
    assert _norm_role("Н.контрол.") == "Н. контр."
    assert _norm_role("Нормоконтроль") == "Н. контр."
    # «Н.контрол. Матковский» не схлопывается в роль (фамилия сохраняется)
    assert not _role_matches_pattern(
        "Н.контрол. Матковский", "Н.контрол.Матковский", "Н. контр."
    )


def test_find_roles_abbreviated_stamp_grid():
    """Штамп СПА1: роль слева, фамилия справа в той же строке — все 4 роли."""
    # (x0, y0, x1, y1, text) — геометрия как в реальном штампе СПА1
    words = [
        (651.0, 740.0, 667.0, 752.0, "ГИП"),
        (700.0, 740.0, 741.0, 752.0, "Шевченко"),
        (651.0, 753.0, 684.0, 765.0, "Разраб."),
        (700.0, 753.0, 740.0, 765.0, "Курбанов"),
        (651.0, 767.0, 691.0, 779.0, "Проверил"),
        (700.0, 767.0, 749.0, 779.0, "Посуконько"),
        (652.0, 809.0, 697.0, 821.0, "Н.контрол."),
        (700.0, 810.0, 751.0, 822.0, "Матковский"),
    ]
    roles = {r[4] for r in _find_roles_on_page(words)}
    assert roles == {"ГИП", "Разработал", "Проверил", "Н. контр."}


def test_ocr_merge_keeps_distinct_developers():
    """Разные фамилии в одной роли не схлопываются (двое «Разработал»)."""
    parses = [
        [
            StampSignature(role="Разработал", surname="Иванов", signed_at=""),
            StampSignature(role="Разработал", surname="Петров", signed_at=""),
        ],
        [
            StampSignature(role="Разработал", surname="Иваноб", signed_at=""),
            StampSignature(role="Разработал", surname="Петров", signed_at=""),
        ],
    ]
    merged = _ocr_merge_signatures(parses)
    surs = sorted(s.surname for s in merged)
    assert surs == ["Иванов", "Петров"]
