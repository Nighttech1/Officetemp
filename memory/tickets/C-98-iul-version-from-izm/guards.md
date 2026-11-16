# Guards C-98 — версия ИУЛ = последний Изм

## Авто
```text
cd backend
python -m pytest tests/test_iul_stamp.py -q -k "revision or kj62"
cd frontend
npx tsx lib/iul-formation.selftest.ts
```
Ожидание:
- `test_revision_version_from_table_text`: таблица Изм 1..2 → max `2`
- `test_revision_version_from_title_paren`: `(изм. 1)` → `1`
- `test_analyze_kj62…`: `doc_version == "1"`
- selftest: `normalizeIulVersion("Изм.2") === "2"`, mergeIzm → version `"2"`

## Ручная / API
- `templates/…КЖ6.2.pdf` → версия `1`
- PDF с Изм.2 / Изм.3 в имени или на титуле → в ячейке «Версия» только цифра (`2` / `3`), не «Изм.2»
- Таблица на титуле Изм|№ док|Подп|Дата с рядами 1 и 2 → версия `2`
