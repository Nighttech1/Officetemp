# Guards — C-19 Playwright E2E + CI

## Automated (local)

```bash
cd backend
# Skips cleanly if FE not on :3000
.venv/Scripts/python.exe -m pytest -q tests/test_e2e_cabinet.py -m e2e

# With servers up:
# API :8000 (eager OK) + Next :3000
$env:E2E_BASE_URL="http://127.0.0.1:3000"
.venv/Scripts/python.exe scripts/e2e_cabinet.py
.venv/Scripts/python.exe -m pytest -q tests/test_e2e_cabinet.py -m e2e
```

Expect when FE up: DocSaaS on login; unique register → `/app`; `/app/templates` reachable; no horizontal scroll at 390 on login.

## CI

`.github/workflows/e2e.yml`:
- `unit` — full `pytest -q` (e2e skips if no FE)
- `e2e` — start uvicorn + next, then force e2e pytest

Optional dual: `frontend/playwright.config.ts` + `frontend/e2e/cabinet.spec.ts` (needs `npm i -D @playwright/test`).

## Data-safety

E2E registers disposable users only; no DB truncate/wipe scripts.
