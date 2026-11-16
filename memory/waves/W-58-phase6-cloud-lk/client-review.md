# W-58 client review — надёжность хранения ЛК (без VPS)

## Вердикт
**ПРИНЯТО С ЗАМЕЧАНИЯМИ**

Нельзя писать «согласовано» на prod/VPS: живой Postgres/MinIO на этой машине не поднят (Docker отсутствует, winget Postgres отклонён UAC). Код фазы 6.1–6.3 и unit-guards готовы; полный E2E «второй браузер видит Word» — после Docker Compose.

## Где смотрел
- API localhost `http://127.0.0.1:8005` (новый код; 8001/8002 — зомби-порты)
- FE `http://127.0.0.1:3000` → proxy `API_PROXY_TARGET=8005`
- Pytest: profile/storage/workspace/auth/templates — green
- Smoke: register → profile GET/PATCH/export — OK; storage upload (TestClient + .NET no-proxy) — local backend

## Что убеждает в сохранности данных на VPS (после 6.4)
1. Метаданные проектов/папок/документов — Postgres org-scoped snapshot + revision/409
2. Word/Excel — `POST /storage/objects` → MinIO или durable `backend/.runtime/blobs`, ключи в snapshot
3. ПДн — только PiiService; export/erase + audit; TTL hook
4. PDF ИУЛ исходники — strip, не хранятся
5. Runbook: `docs/POSTGRES_DEV.md`, `docs/VPS_READINESS.md` (бэкап тома до разрушающих операций)

## Замечания (не P0 кода; блокеры среды)
- C-601.2/1.4 и C-603.6 E2E: нужен `docker compose up db redis minio`
- На Windows системный proxy `127.0.0.1:2081` ломает Python urllib/httpx к localhost → тестировать с NO_PROXY или без proxy
- 6.2.6/6.2.7 (encryption/RLS) — желательно, следующий проход
- VPS деплой — только после явного «да»

## C-*
- C-601, C-602, C-603 — код+guards; живой Postgres smoke open
