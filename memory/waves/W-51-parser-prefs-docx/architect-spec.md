# W-51 — парсер КЖ6.2 + DOCX-кнопка + PreferencesCard на данных

## Тикеты
- **C-121** P0 — IUL stamp: наименование раздела для `56-0321-ОК-1-2-КЖ6.2.pdf` (и обобщение эвристик)
- **C-122** P1 — Накладная: «Сформировать DOCX» рядом с «Сформировать PDF» (как в ИУЛ / шаг генерации)
- **C-123** P1 — Шаг «Данные»: PreferencesCard — Excel / Облако / ИУЛ; поля только в detail

## Chain
Backend (iul_stamp) → Frontend → Tester → Fixer → Deployer → Client
