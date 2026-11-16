# W-57 — Аудит готовности бэкенда к VPS (только план, без кода)

## Вердикт Архитектора
**НЕ ГОТОВЫ** к полноценному production-деплою «как личный кабинет с облачным деревом документов».  
Каркас PostgreSQL + auth + workspace sync **есть**, но source-of-truth для файлов и UX-синка ещё на браузере (localStorage/IndexedDB). Локальный SQLite в `.env` ≠ prod Postgres.

## Что уже есть (плюс)
- Postgres-модели + Alembic 001–004: `organizations`, `users`, схема `pii` (`user_profiles`, `access_audit`), workspace (`projects/folders/documents/signatures`), jobs, templates, generation_logs
- JWT register/login/me + PiiService + audit
- API `GET/PUT /workspace/snapshot` (org-scoped)
- docker-compose: `db` (postgres:16), redis, minio, api, worker, beat
- Dual-write фронт: `workspace-sync.ts` при логине

## Критические пробелы (минус)
1. Dev сейчас на **SQLite**, не на Postgres volume
2. Бинарники шаблонов/PDF — в **IndexedDB браузера**, на сервер не уезжают (в БД только JSON wizard)
3. Нет PostgreSQL **RLS** — изоляция только в коде сервиса
4. Sync не continuous (в основном login); риск 422/конфликтов snapshot
5. VPS: секреты, TLS, бэкапы, миграции на чистом Postgres, MinIO/S3 prod — не закрыты как runbook «нажать и жить»
6. ПДн: нет column-level encryption / export+erase API / TTL политики

## Chain (когда разрешат разработку)
Personal-Data DB → Backend → Frontend (sync+files) → DevOps → Tester → Deployer → Client  

## Где чекбоксы для следующего чата
Пошаговый план с галочками внесен в **`roadmap.md` → Фаза 6** (пункты `6.1.x` … `6.4.x`).  
Клиент указывает номера в чате, например: «приступаем к 6.2» или «делаем 6.3.4».
