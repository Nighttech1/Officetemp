# Плагины — Personal Data DB / User Accounts

| Name | Type | Where | When |
|------|------|-------|------|
| personal-data-db | skill | `.cursor/skills/personal-data-db/` | схема ПДн, 152-ФЗ |
| supabase-postgres-best-practices | skill | `.agents/skills/supabase-postgres-best-practices/` | RLS/indexes |
| safe-db-migrations | skill | `.cursor/skills/safe-db-migrations/` | миграции |
| alembic | tool | `plugins/db-admin/alembic/` | миграции Postgres |
| fastapi-users | lib ref | `plugins/user-accounts/fastapi-users/` | auth users |

ПДн не класть в общую app-схему шаблонов. Ссылки только по `user_id`.
