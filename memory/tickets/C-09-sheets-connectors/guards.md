# Guards — C-09 Google + Yandex connectors

```bash
cd backend && pytest tests/test_google_sheets.py tests/test_yandex_sheets.py -q
```
Expected: mocked HTTP fetch works; missing credentials → ConfigError / API 503.
