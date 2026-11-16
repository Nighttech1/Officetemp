# W-58 deploy localhost

- API: http://127.0.0.1:8001 (uvicorn reload)
- FE: http://127.0.0.1:3000
- DB for this smoke session: SQLite file `backend/.runtime/phase6_smoke.db` — **только потому что Docker/Postgres на машине недоступны** (winget install отклонён UAC).
- Целевой `.env` / `.env.example`: PostgreSQL `127.0.0.1:5432` — см. `docs/POSTGRES_DEV.md`.
- Blobs: `backend/.runtime/blobs` (local fallback; MinIO when compose up).
- VPS: **не деплоилось** (вне scope + нет «да» Клиента).
