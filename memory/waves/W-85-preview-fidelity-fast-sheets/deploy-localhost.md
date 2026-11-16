# Deploy localhost — 2026-10-03

## Поднято
- Docker Desktop → `docker compose up -d db redis` (Postgres 5432, Redis 6379) — healthy
- API: `uvicorn app.main:app --host 127.0.0.1 --port 8005 --reload`
- FE: `npm run dev -- --hostname 127.0.0.1 --port 3000`

## Проверки
- `GET http://127.0.0.1:8005/health` → ok
- `GET http://127.0.0.1:3000/app/documents/waybills` → 200
- smoke `POST /api/v1/data/from-url` на gid=124580750

## URL для проверки
- Кабинет: http://127.0.0.1:3000/app/documents/waybills
- API: http://127.0.0.1:8005/health
