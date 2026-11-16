# Postgres for local cloud ЛК / stage / VPS

## Правило (фаза 6.1)

- **Повседневная работа облачного ЛК, stage, VPS:** только `DATABASE_URL=postgresql+…`
- **SQLite** — только для `pytest` (`backend/tests/conftest.py` сам подставляет)
- Файл `backend/.env` указывает на Postgres на `127.0.0.1:5432` (порт compose `db`)

## Portable (без Docker / без прав админа)

На рабочих ПК без админки инструмент лежит в `E:\Applications\Tools`:

| Сервис | Путь | Старт |
|--------|------|--------|
| PostgreSQL 16 | `E:\Applications\Tools\postgres\pgsql` | `start-postgres.cmd` |
| Redis 5 | `E:\Applications\Tools\redis` | `start-redis.cmd` |
| Файлы | `backend/.runtime/blobs` | fallback без MinIO |

```bat
E:\Applications\Tools\postgres\start-postgres.cmd
E:\Applications\Tools\redis\start-redis.cmd
cd /d E:\Applications\OfficeTemp\backend
.venv\Scripts\alembic.exe upgrade head
.venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8005
```

`DATABASE_URL=postgresql+psycopg2://docsaas:docsaas@127.0.0.1:5432/docsaas`  
Скачивания только в `E:\Applications\Tools\downloads` — без winget/UAC.


```bash
# из корня репозитория
docker compose up -d db redis minio
cd backend
# Host API → published ports
# DATABASE_URL=postgresql+psycopg2://docsaas:docsaas@127.0.0.1:5432/docsaas
..\backend\.venv\Scripts\alembic.exe upgrade head
..\backend\.venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8001 --reload
```

Smoke:

```bash
curl -s http://127.0.0.1:8001/health
curl -s -X POST http://127.0.0.1:8001/api/v1/auth/register -H "Content-Type: application/json" -d "{\"org_name\":\"Demo\",\"email\":\"demo@example.com\",\"password\":\"password123\",\"full_name\":\"Demo\",\"consent\":true}"
```

Чистая проверка Alembic 001→004: поднять пустой volume `docsaas_pgdata` (или новую БД) и `alembic upgrade head`.

## Файлы клиентов

- Метаданные проектов/папок/документов — Postgres (workspace snapshot)
- Бинарники Word/Excel — **диск** (`STORAGE_BACKEND=local`, том `docsaas_blobs` / `LOCAL_BLOB_ROOT`)
- MinIO/Yandex — опционально позже (`STORAGE_BACKEND=s3`)
- Исходные PDF ИУЛ — **не хранятся на сервере** (политика 6.3.5)

Подробнее: `docs/FILE_STORAGE.md`.
