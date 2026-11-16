# Localhost deploy — 2026-09-25

## Деплоер
- API: `http://127.0.0.1:8001` (uvicorn --reload, SQLite local_dev.db)
- FE: `http://127.0.0.1:3000` (next dev, proxy → :8001)
- Smoke: `/health` ok; `/api/v1/workspace/snapshot` → 401 без токена

## Не делали
- VPS / Postgres docker (не просили; VPS только после явного «да»)
