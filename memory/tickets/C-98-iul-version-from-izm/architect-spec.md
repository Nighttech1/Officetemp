# Architect — C-98 W-42

## Backend `iul_stamp.py`
`_pick_revision_version(doc)`:
1. Текст титула/штампа: regex `Изм(?:енение)?\.?\s*(\d+)`, `(изм.\s*N)`, строки `N - Зам. …` у таблицы изменений → max N
2. Таблицы pymupdf: заголовок с «Изм» + «док»/«Дата» → max в колонке Изм.
3. `result.doc_version = str(max)` или ""

## Frontend
- `normalizeIulVersion`: «Изм.2» → «2»; чистое число оставить
- `mergeIzmIntoDesignation`: после переноса в шифр **оставить номер** в version

## chain
Backend → Frontend → Tester → Fixer → Deployer → Client
