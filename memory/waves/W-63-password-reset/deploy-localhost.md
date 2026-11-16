# W-63 deploy localhost

- API: http://127.0.0.1:8005 (uvicorn, Postgres, `DEBUG=true`, local blobs)
- FE: http://127.0.0.1:3000 (proxy → 8005)
- Migration: `005_password_reset` applied
- VPS SSH: **not run** (await Client «да»)
