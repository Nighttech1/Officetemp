# Chain — W-03 (C-08, C-09, C-10)

1. Excel Parser — excel_parser.py + fixtures + tests
2. Google Sheets — google_sheets.py (httpx mockable)
3. Yandex Sheets — yandex_sheets.py (httpx mockable)
4. Data Aggregator — aggregator.py unified Dataset
5. Backend — data router + config env + requirements (pandas, openpyxl)
6. Tester → Fixer → Deployer → Client

Paths under `backend/app/services/connectors/**`, `backend/app/api/routers/data.py`, `backend/tests/test_data_*.py`.
