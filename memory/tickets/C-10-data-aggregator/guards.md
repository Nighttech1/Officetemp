# Guards — C-10 Data Aggregator

```bash
cd backend && pytest tests/test_aggregator.py tests/test_data_api.py -q
```
Expected: unified `{source, columns, rows, meta}` from excel/google/yandex; `POST /api/v1/data/aggregate`.
