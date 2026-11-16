# Guards — C-18 Load test

## Automated

```bash
cd backend
# Redis NOT required — CELERY_TASK_ALWAYS_EAGER via conftest / --inprocess
.venv/Scripts/python.exe -m pytest -q tests/test_load_smoke.py
.venv/Scripts/python.exe scripts/load_test_jobs.py --inprocess --rows 100
# optional live:
# .venv/Scripts/python.exe scripts/load_test_jobs.py --rows 100 --api http://127.0.0.1:8000
```

Expect: smoke creates job with 10 rows → status `done` → ZIP nonempty (10 files); script writes `memory/waves/W-06-phase5-hardening/load-report.md` with rows, seconds, rows/sec, mode.

## Data-safety

- Uses temp / test `ARTIFACT_ROOT` only; no wipe of production DB or memory_storage.
- No VPS deploy in this ticket.
