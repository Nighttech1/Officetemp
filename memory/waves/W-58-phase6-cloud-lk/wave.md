# Wave W-58 — Phase 6 cloud LK readiness

- Started: 2026-09-29
- Scope: roadmap 6.1–6.3 (+ docs for 6.4); **no VPS deploy**
- Tickets: C-601, C-602, C-603
- Status: code complete for 6.1–6.3; live Postgres smoke blocked (no Docker); VPS not deployed
- Localhost API: http://127.0.0.1:8005 — **на портативном Postgres** (`E:\Applications\Tools\postgres`), Alembic head, smoke register/login OK
- Redis: `E:\Applications\Tools\redis` :6379
- Policy: downloads only to `E:\Applications\Tools` (no admin / no winget)
