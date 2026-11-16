# Deploy localhost — проверка W-75 / кабинет

**Дата:** 2026-10-02  
**Gate:** READY_FOR_CLIENT

| Сервис | URL | Статус |
|--------|-----|--------|
| Сайт | http://127.0.0.1:3000/ | up |
| Накладные | http://127.0.0.1:3000/app/documents/waybills | up |
| ИУЛ | http://127.0.0.1:3000/app/documents/info-sheet | up |
| API | http://127.0.0.1:8005/health | ok |
| Proxy | http://127.0.0.1:3000/health → 8005 | ok |
| Postgres | 5432 | Tools |
| Redis | 6379 | Tools |

VPS: нет
