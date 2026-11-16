# VPS readiness checklist (фаза 6.4) — без SSH в этом документе

Выполнять **только после** зелёных 6.1–6.3 и явного «да» / «согласовано» Клиента на prod.

## Стратегия файлов (решение 2026-09-30)

**Prod-default: диск того же VPS**, отдельный Docker volume `docsaas_blobs`  
(путь в контейнере `/app/.runtime/blobs`, `STORAGE_BACKEND=local`).

Платный Yandex Object Storage / обязательный MinIO — **не требуются** для первого деплоя.  
MinIO можно включить позже (`STORAGE_BACKEND=s3` + profile `objectstore`).

## Чеклист

1. Compose: `api` + `worker` + `beat` + `db` + `redis` + тома `docsaas_pgdata` + **`docsaas_blobs`** (+ `docsaas_artifacts` для job ZIP)
2. Секреты: новый `JWT_SECRET`, пароли Postgres — не дефолты из репо
3. HTTPS + `CORS_ORIGINS` на боевой домен; `PUBLIC_APP_URL=https://DOMAIN` для ссылок сброса пароля
3b. SMTP (`SMTP_HOST`/`SMTP_FROM`/…) для писем восстановления пароля; на prod `DEBUG=false` (без `debug_reset_url` в API)
4. `alembic upgrade head` на пустой/бэкапнутой Postgres (включая `005_password_reset`)
5. **Бэкап** тома Postgres **и** тома файлов (`docsaas_blobs`) до разрушающих операций
6. Smoke: регистрация → логин → **forgot/reset пароля** → проект/папка/документ → Word на диске → генерация DOCX/PDF; второй аккаунт не видит чужое
7. Без явного «да» Клиента — **не** выполнять SSH/деплой на VPS

См. также: `docs/RELEASE.md`, `docs/POSTGRES_DEV.md`, `docs/FILE_STORAGE.md`, `roadmap.md` §6.4.
