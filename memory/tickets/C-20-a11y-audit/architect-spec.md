# Architect Spec — W-06 (load / E2E / a11y)

## Scope ≤3
C-18 load, C-19 Playwright E2E+CI, C-20 a11y fixes.

**Out:** 5.5 prod VPS (needs explicit user yes), 5.8 forms/mail, C-14 asset pipeline, Payment, Security cycle.

## C-18 Load
- Script uses existing `POST /api/v1/jobs` with flat_tags.docx + N synthetic rows
- Default N=100; support `--rows 1000`
- Env: `CELERY_TASK_ALWAYS_EAGER=true` for local without Redis OR document Redis required for 1000
- Write `memory/waves/W-06-phase5-hardening/load-report.md` with wall time, rows, success
- Pytest: `test_load_smoke.py` with 10 rows (ci-friendly)

## C-19 E2E
- Prefer `frontend/e2e` with `@playwright/test` if npm available via Cursor node; else `backend/scripts/e2e_cabinet.py` + pytest marker
- Scenarios: open /login DocSaaS visible; register unique user; land on /app; logout/gate
- Needs FE :3000 + API :8000 — document; CI workflow that starts both or uses webServer config
- `.github/workflows/e2e.yml` — on push/PR path frontend|backend

## C-20 A11y
- Fix login/register/app layout: associated labels, button type, focus-visible ring, skip to main, lang=ru
- Report before/after in ticket folder
- No design system purple; keep teal tokens

## Chain
Архитектор → Backend (load) → Playwright E2E → Frontend/a11y → Тестировщик → Фиксер → Деплоер → Клиент
