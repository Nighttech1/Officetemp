# DocSaaS — Release pack · готовность к VPS

**VPS / production SSH выполняется только после явного «да» / «согласовано» Клиента (roadmap 6.4.7).**  
Этот документ не разрешает деплой сам по себе.

## Архитектура данных на VPS

| Данные | Где |
|--------|-----|
| ЛК, проекты, папки, метаданные | Postgres (`docsaas_pgdata`) |
| Word/Excel файлы | Диск VPS volume `docsaas_blobs` (`STORAGE_BACKEND=local`) |
| Job ZIP / forms | `docsaas_artifacts` |
| PDF исходники ИУЛ | не храним |

Платный Object Storage **не нужен** для первого релиза.

## Localhost

```bash
# Portable (Windows без Docker): Postgres/Redis из E:\Applications\Tools
# или:
docker compose up -d db redis

cd backend && alembic upgrade head
# STORAGE_BACKEND=local в .env
uvicorn app.main:app --host 127.0.0.1 --port 8005

cd frontend && npm run dev   # API_PROXY_TARGET → API
```

Полный стек:

```bash
docker compose -f docker-compose.yml -f docker-compose.release.yml up -d --build
```

## Пакет для VPS (после «да»)

1. Скопировать репо на сервер  
2. `cp .env.production.example .env` → заполнить **новые** `JWT_SECRET`, `POSTGRES_PASSWORD`, `CORS_ORIGINS=https://ваш-домен`  
3. `bash scripts/backup-vps-volumes.sh /var/backups/docsaas` (если уже есть тома)  
4. `docker compose -f docker-compose.yml -f docker-compose.release.yml up -d --build`  
5. `docker compose exec api alembic upgrade head`  
6. HTTPS (Caddy/nginx) → API + frontend  
7. Smoke: register → login → проект → Word → generate; второй аккаунт не видит чужое  

Бэкап: `scripts/backup-vps-volumes.sh` — Postgres dump + `blobs.tar.gz`.

## Env checklist

| Переменная | Prod |
|------------|------|
| `DATABASE_URL` | postgresql+… (обязательно) |
| `JWT_SECRET` | длинный random, не из репо |
| `POSTGRES_PASSWORD` | сильный, не `docsaas` |
| `CORS_ORIGINS` | боевой HTTPS домен |
| `STORAGE_BACKEND` | `local` |
| `LOCAL_BLOB_ROOT` | `/app/.runtime/blobs` |

## Gate

| Шаг | Статус |
|-----|--------|
| 6.1–6.3 ядро + local blobs | готово |
| 6.3.6 second-session files | guard в pytest |
| 6.4 пакет (compose/env/backup) | готово в репо |
| 6.4.6 smoke на VPS | после деплоя |
| 6.4.7 «да» Клиента | **ожидается** |

До «да» запрещено: SSH/scp wipe на VPS, смена DNS/TLS prod.
