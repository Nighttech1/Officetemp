# C-601 — Postgres-only cloud ЛК

## Done
- `backend/.env` → PostgreSQL `127.0.0.1:5432`
- `.env.example` / `backend/.env.example` — Postgres-only for stage/VPS
- `docs/POSTGRES_DEV.md` + `docs/VPS_READINESS.md` (без SSH)
- Warning on SQLite startup for accidental misuse

## Guard
- Unit tests green with sqlite in conftest (pytest isolation)
- Live Alembic 001→004 smoke requires Docker Desktop `db` (see POSTGRES_DEV.md)
