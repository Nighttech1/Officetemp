# Guards — C-08 Excel/CSV

```bash
cd backend && pytest tests/test_excel_parser.py tests/test_data_api.py -q
```
Expected: xlsx/csv → Dataset rows; `POST /api/v1/data/excel` with JWT.
