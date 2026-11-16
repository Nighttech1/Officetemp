# W-21 — C-51 Google URL → листы → шаг 3

**Ticket:** C-51  
**Goal:** После вставки ссылки Google — список листов и колонки на шаге 3.

## Chain
1. Architect — spec (done: `/api/v1/data/from-url` + FE Подключить)
2. Backend — cloud_url + SQLite local API (Postgres/Docker недоступны)
3. Frontend — авто-Подключить по paste/blur, тексты
4. Tester — API smoke + UI
5. Fixer — по красному
6. Deployer — localhost API+FE
7. Client — приёмка

## Paths
- `backend/app/services/connectors/cloud_url.py`
- `backend/app/api/routers/data.py`
- `frontend/components/docs/WaybillWizard.tsx`
- `frontend/components/docs/CloudSheetsHelp.tsx`
- `frontend/lib/api.ts` (`fetchCloudTable`)
