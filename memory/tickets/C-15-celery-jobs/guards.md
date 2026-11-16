# Guards — C-15 / C-16 / C-17 (W-05)

## Automated

```bash
cd backend
# Redis NOT required — CELERY_TASK_ALWAYS_EAGER=true in conftest
.venv/Scripts/python.exe -m pytest -q tests/test_jobs_api.py tests/test_cleanup.py
.venv/Scripts/python.exe -m pytest -q
```

Expect: job create → eager done → ZIP has `row_00000.docx` + `row_00001.docx`; cleanup removes aged dirs only under `ARTIFACT_ROOT` / `.runtime/jobs`; full suite green.

## Data-safety

- Cleanup deletes **only** under jobs artifact root (never DROP users/orgs/pii).
- Job PII rows live in `rows.json` on disk, not long-term in Redis.
- No VPS deploy in this wave.

## Manual (optional, with Redis)

```bash
docker compose up -d redis worker api
# POST /api/v1/jobs … then poll GET /api/v1/jobs/{id}
```
