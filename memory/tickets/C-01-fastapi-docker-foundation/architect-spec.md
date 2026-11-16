# Architect Spec — W-01 Phase 1 Foundation

## Контекст

Greenfield Doc SaaS. Фаза 1 roadmap: FastAPI + PostgreSQL + Docker, схема БД, JWT/RBAC, S3-совместимое хранилище.  
152-ФЗ: ПДн изолированы от бизнес-данных шаблонов/логов.

## Границы волны

**В scope:** C-01, C-02, C-03  
**Вне scope:** Frontend, Doc Engine, Celery, коннекторы, Security/Hacker, VPS

## Целевая структура репо

```
backend/
  app/
    main.py
    core/          # settings, security (JWT), rbac
    db/            # engine, session, base
    models/        # Organization, User (auth), Template, GenerationLog
    schemas/       # Pydantic v2
    api/           # routers: health, auth, templates, storage
    services/      # s3 client, pii gateway
  alembic/
  tests/
docker-compose.yml
.env.example
```

## Контракты данных

### App DB (schema `public`)

| Table | Key fields | Tenant |
|-------|------------|--------|
| organizations | id UUID, name, created_at | self |
| users | id UUID, organization_id, role (owner\|admin\|member), password_hash, is_active | organization_id |
| templates | id UUID, organization_id, name, storage_key, created_by, created_at | organization_id |
| generation_logs | id UUID, organization_id, template_id, status, created_by, meta JSON, created_at | organization_id |

Запрет: email, phone, full_name в `public`.

### PII schema `pii` (Personal-Data DB)

| Table | Key fields |
|-------|------------|
| user_profiles | user_id UUID PK, email (unique), full_name, phone nullable, consent_at, created_at |
| access_audit | id, actor_user_id, subject_user_id, action, created_at |

Доступ к `pii.*` только через сервисный слой `PiiService` (не сырой ORM из роутеров шаблонов).  
Каждое чтение/запись профиля → строка в `access_audit`.

## Auth / RBAC

- JWT HS256 (секрет из env), claims: `sub` (user_id), `org_id`, `role`, `exp`
- Endpoints: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`
- Register создаёт Organization + User (owner) + pii.user_profiles
- Dependencies: `get_current_user`, `require_roles(...)`
- Все list/get Templates/Logs фильтруют по `org_id` из токена (P0 если нет)

## Storage (S3)

- MinIO в compose (порты 9000/9001)
- boto3 / aioboto3-compatible sync client OK для MVP
- `POST /api/v1/storage/presign-upload` → key `org/{org_id}/templates/{uuid}`
- Bucket из env; credentials из env

## Infra

- `docker-compose.yml`: `api`, `db` (postgres:16), `minio`
- API health: `GET /health` → `{status: ok}`
- Alembic additive migration `001_initial`
- `.env.example` без секретов-продакшена

## Инварианты

1. Cross-tenant SELECT Templates = баг P0
2. ПДн не логируются в plaintext в app logs
3. Нет DROP в миграциях
4. Секреты не в git

## Acceptance

См. `memory/waves/W-01-phase1-foundation.md`

## Chain

См. `memory/tickets/C-01-fastapi-docker-foundation/chain.md` (единый chain волны).
