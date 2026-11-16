# Guards — C-51 cloud URL sheets

## Regression
1. API `POST /api/v1/data/from-url` with public Google URL → 200, `meta.extra.sheets` non-empty, `rows.length > 0`.
2. Step 2: after «Подключить» — combobox «Лист (страница) таблицы» visible.
3. Step 3: row range shows Google row count; status lists column names.
4. Port 3000 must serve OfficeTemp DocSaaS (not ITLearn).

## Verified 2026-09-23
- from-url: sheets=Class Data, cols=6, rows=30
- UI: sheet combobox + step 3 row picker 1–30
