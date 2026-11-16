# Deploy localhost — полный сайт (FE + BE)

**Дата:** 2026-10-02  
**Gate:** READY_FOR_CLIENT

## Сервисы

| Сервис | URL | Статус |
|--------|-----|--------|
| Frontend | http://127.0.0.1:3000/ | 200 |
| API | http://127.0.0.1:8005/health | `{"status":"ok"}` |
| FE→API proxy | http://127.0.0.1:3000/health | 200 |
| Postgres | 127.0.0.1:5432 | Tools portable |
| Redis | 127.0.0.1:6379 | Tools portable |

## Примечание
`backend/.venv` указывал на отсутствующий Python `D:\…`. API поднят через рабочий `backend/.venv.broken-py312` (Python 3.12).

VPS: нет
