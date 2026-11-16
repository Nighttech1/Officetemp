# Architect Spec — W-03 Data Connectors

## Scope
C-08 Excel/CSV, C-09 Google+Yandex adapters, C-10 Aggregator.  
Out: Frontend mapper, Celery, VPS, Security cycle.

## Contract (Aggregator output)
```json
{
  "source": "excel|csv|google|yandex",
  "columns": ["..."],
  "rows": [{ "...": "..." }],
  "meta": { "row_count": 0, "fetched_at": "ISO-8601" }
}
```

## Modules
```
backend/app/services/connectors/
  excel_parser.py
  google_sheets.py
  yandex_sheets.py
  aggregator.py
backend/app/api/routers/data.py
backend/tests/fixtures/data/ sample.xlsx sample.csv
```

## API (JWT)
- `POST /api/v1/data/excel` — multipart file → Dataset
- `POST /api/v1/data/google` — JSON `{spreadsheet_id, range}` → Dataset (uses GOOGLE_SERVICE_ACCOUNT_JSON path/env; mock in tests)
- `POST /api/v1/data/yandex` — JSON `{spreadsheet_id, range}` → Dataset (YANDEX_API_KEY / OAuth token env; mock)
- `POST /api/v1/data/aggregate` — `{ "source": "excel|google|yandex", ... }` unified entry

## Rules
- Column names: strip, keep original keys in rows after normalize (snake/trim)
- Drop trailing empty rows; dates → ISO when detectable
- Max rows: settings `data_max_rows` default 5000
- Never log full PII sheets
- Google: note 152-ФЗ risk in README; prefer Yandex/Excel for RF PII

## Chain
Архитектор → Excel Parser → Google Sheets → Yandex Sheets → Data Aggregator → Backend → Тестер → Фиксер → Деплоер → Клиент
