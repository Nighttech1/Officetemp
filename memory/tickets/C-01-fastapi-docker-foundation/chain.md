# Chain — W-01 (C-01, C-02, C-03)

Порядок строго последовательный по overlapping paths (`backend/`, `docker-compose.yml`, Alembic).

1. **Архитектор** — spec (done в этой папке + C-02/C-03 ссылки)
2. **Personal-Data DB** — схема `pii`, модели профилей, `PiiService`, audit; миграция pii-части
3. **Backend** — FastAPI app, public models, JWT/RBAC, S3, Docker Compose, интеграция с PiiService
4. **Тестировщик** — pytest: health, register/login, tenant isolation, pii separation, storage presign; guards.md на каждый C-*
5. **Фиксер** — до зелёного pytest
6. **Деплоер** — `docker compose up -d` localhost; проверить `/health` и `/docs`
7. **Клиент** — приёмка

## Paths

| Роль | Paths |
|------|-------|
| Personal-Data DB | `backend/app/models/pii.py`, `backend/app/services/pii_service.py`, части Alembic `pii` |
| Backend | `backend/**`, `docker-compose.yml`, `.env.example`, `backend/tests/**` |
| Не трогать | Frontend, Doc Engine, prod VPS, sputnik_data.db |

## Skills

- `fastapi-saas`, `backend`, `safe-db-migrations`, `pydantic-v2`, `personal-data-db`
- Postgres best practices (RLS/indexes) — адаптировать
