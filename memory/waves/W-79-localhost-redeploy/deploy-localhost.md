# Deploy localhost — 2026-10-03

| Сервис | Адрес | Статус |
|--------|-------|--------|
| Postgres | 127.0.0.1:5432 | Tools portable |
| Redis | 127.0.0.1:6379 | Tools portable |
| Backend API | http://127.0.0.1:8005 | uvicorn --reload |
| Frontend | http://127.0.0.1:3000 | next dev |

Запуск:
1. `E:\Applications\Tools\postgres\start-postgres.cmd`
2. `E:\Applications\Tools\redis\start-redis.cmd`
3. `backend\.venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8005 --reload`
4. `frontend`: `npm run dev -- --hostname 127.0.0.1 --port 3000`
