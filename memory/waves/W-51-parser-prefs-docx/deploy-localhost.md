# Deploy localhost — W-51 (обновлено 2026-09-29)

## Среда
- **Frontend:** http://127.0.0.1:3000 — `next dev`
- **API:** http://127.0.0.1:8001 — uvicorn `--reload`, `CELERY_TASK_ALWAYS_EAGER=true`
- **БД:** SQLite `backend/.runtime/local_dev.db` (данные не трогали)
- **VPS/prod:** не деплоили

## Проверки
- `GET http://127.0.0.1:8001/health` — ok
- `GET http://127.0.0.1:3000` — 200
- `GET http://127.0.0.1:3000/app/documents/waybills` — 200

## Gate
Localhost для ручной приёмки. Prod только после «согласовано» Клиента.
