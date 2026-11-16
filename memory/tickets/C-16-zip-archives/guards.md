# Guards — C-16 ZIP archives

```bash
cd backend && pytest tests/test_jobs_api.py -q
```
Expected: job with ≥2 rows → status `done` → `GET /jobs/{id}/download` returns ZIP with row artifacts.
