# W-58 — Фаза 6: облачный ЛК (без VPS-деплоя)

## Цель для Клиента
После волны на localhost можно убедиться: кабинеты, проекты, папки и **файлы шаблонов Word** живут в PostgreSQL + MinIO, а не только в браузере. Деплой на VPS (6.4 SSH) — **вне scope**.

## Границы
- **В scope:** 6.1.1–6.1.4, 6.2.1–6.2.5, 6.3.1–6.3.6; runbook-черновик под 6.4 (доки).
- **Вне scope:** SSH/prod на `155.212.187.181`; второй цикл Security+Hacker; 6.2.6/6.2.7 желательные — только если останется время после P0.

## Инварианты
1. Stage/dev-облако API: только `DATABASE_URL=postgresql+…` (SQLite — только unit-тесты).
2. ПДн только через `PiiService` + `access_audit`; export/erase — права субъекта.
3. Workspace snapshot org-scoped; PUT идемпотентен; конфликты — явный код (409), не «тихий» 422.
4. Бинарники шаблонов: MinIO/S3 `storage_key` в метаданных; IndexedDB — кэш, не единственный источник.
5. PDF ИУЛ: политика «не хранить на сервере по умолчанию» (документировать + не заливать).

## Тикеты (≤3 за проход)
| ID | P | Roadmap | Acceptance |
|----|---|---------|------------|
| C-601 | P0 | 6.1.* | Compose Postgres; Alembic 001→004 на чистой БД; smoke health/register/login; `.env.example` + runbook Postgres-only |
| C-602 | P0 | 6.2.1–5 | Profile GET/PATCH через PiiService; export JSON; erase+audit; TTL policy + cleanup hook |
| C-603 | P0 | 6.3.* | Snapshot stable; expected_revision; continuous sync; Word→presign S3; E2E другой браузер видит файлы |

## Out of wave (следующий проход / «да» Клиента)
6.4.* VPS deploy; опционально RLS + column encryption (6.2.6–7).
