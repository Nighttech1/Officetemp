# Deploy localhost — backend + frontend

**Дата:** 2026-10-01  
**Цель:** полный просмотр сайта (FE + API)  
**Gate:** READY_FOR_CLIENT

## Сервисы

| Сервис | URL / порт | Статус |
|--------|------------|--------|
| Frontend Next | http://127.0.0.1:3000/ | 200 |
| API uvicorn | http://127.0.0.1:8005/health | `{"status":"ok"}` |
| FE → API proxy | http://127.0.0.1:3000/health | 200 (rewrite на 8005) |
| Postgres | 127.0.0.1:5432 | Tools portable |
| Redis | 127.0.0.1:6379 | Tools portable |

## Как поднято

1. `E:\Applications\Tools\postgres\start-postgres.cmd`
2. `E:\Applications\Tools\redis\start-redis.cmd`
3. Пересоздан `backend/.venv` на Python 3.11 (старый venv указывал на чужой Python 3.12)
4. `uvicorn app.main:app --host 127.0.0.1 --port 8005 --reload`
5. `npm run dev` → `:3000` (`API_PROXY_TARGET=http://127.0.0.1:8005`)

## Data-safety

- Postgres data cluster не очищался
- `sputnik_data.db` / `memory_storage` не трогались
- Blobs: `backend/.runtime/blobs`

VPS: нет
