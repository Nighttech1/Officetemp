# Guards W-51 (C-121 / C-122 / C-123)

## C-121 — наименование КЖ6.2 с титула
- `pytest tests/test_iul_stamp.py` → 11 passed
- `analyze_stamp_pdf(КЖ6.2)` → `doc_name` содержит «несущие», не «Общие данные», без «…»
- Слабые имена из файла (`АР1.2 ИЗМ3`, только `КЖ6.2`) не принимаются как наименование

## C-122 — Сформировать DOCX рядом с PDF
- Playwright `/app/documents/waybills`: сверху справа кнопки «Сформировать DOCX» + «Сформировать PDF»
- Шаг 4 «Генерация»: те же две кнопки (disabled без строк — ожидаемо)
- Артефакты: `w51-waybills-desktop.png`, `w51-generate-buttons.png`

## C-123 — PreferencesCard на шаге Данные
- Шаг 2: вертикальный список Excel / Облако / ИУЛ
- Клик по строке → detail с полями + «Назад»
- Артефакты: `w51-data-preferences.png`, `w51-data-excel-detail.png`
