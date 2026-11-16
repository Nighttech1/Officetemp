# W-22 chain — C-52 user Google connect

1. Architect — выбор «лучшего» листа + ensure session на from-url
2. Backend/Aggregator — score sheets; optional header-row skip later if needed
3. Frontend — ensureDevSession before fetchCloudTable; clearer errors; sheet highlight
4. Deployer — DocSaaS :3001 (+ CORS), API sqlite
5. Tester — API all_sheets + UI connect
6. Client — full waybill with user template + user URL → generate

Paths:
- `frontend/lib/api.ts`
- `frontend/components/docs/WaybillWizard.tsx`
- `backend/app/services/connectors/cloud_url.py` or aggregator
- `backend/.env` CORS 3001
