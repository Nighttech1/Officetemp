---
name: fastapi-saas
description: >-
  FastAPI SaaS patterns for Doc platform: JWT/RBAC, multi-tenant org isolation,
  async I/O, routers, dependency injection. Use when building API core (phase 1).
---

# FastAPI SaaS (Doc Platform)

## Стек фазы 1

- FastAPI + Uvicorn
- PostgreSQL (+ Alembic / `safe-db-migrations`)
- JWT auth + RBAC
- Pydantic v2 (skill `pydantic-v2`)
- Postgres best practices: `.agents/skills/supabase-postgres-best-practices` (RLS/indexes — адаптировать под свой Postgres, не обязательно Supabase)

## Обязательные сущности

`Users`, `Organizations` (tenant), `Templates`, `GenerationLogs`

## Правила

1. Каждый запрос к данным — с `organization_id` из токена; запрет cross-tenant.
2. `Annotated` dependencies; роутеры по доменам (`auth`, `templates`, `jobs`, `connectors`).
3. Секреты и ключи к Google/Yandex/S3 — только env.
4. Долгие генерации — не в request path → `celery-highload`.
5. OpenAPI актуален; ошибки клиенту без stacktrace/секретов.

## Связи

Backend rule, Doc Engine, User Accounts / Security plugins.
