# W-77 Deploy notes

- FE: Next `127.0.0.1:3000` (уже был up)
- BE: uvicorn `.venv.broken-py312` → `127.0.0.1:8005` (рестарт после schema fix)
- Postgres :5432, Redis :6379 — up
- API_PROXY_TARGET=http://127.0.0.1:8005
