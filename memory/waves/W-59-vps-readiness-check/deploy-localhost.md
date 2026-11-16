# W-59 deploy localhost

- Date: 2026-09-30
- Postgres: `E:\Applications\Tools\postgres` :5432 (portable)
- Redis: `E:\Applications\Tools\redis` :6379
- API: http://127.0.0.1:8005 (no SQLite warning at boot)
- FE: http://127.0.0.1:3000 → proxy 8005
- Blobs: local fallback `backend/.runtime/blobs` (MinIO not installed)
- VPS: **not deployed**
