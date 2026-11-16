# Doc SaaS Backend (Phase 1–5)

FastAPI + PostgreSQL + MinIO foundation with JWT/RBAC, isolated PII schema,
Doc Engine (docxtpl DOCX fill + dxpdf PDF), data connectors
(Excel/CSV, Google Sheets, Yandex Tables), and Celery batch jobs (ZIP + 24h cleanup).

## Run with Docker Compose

From the repository root:

```bash
cp .env.example .env
docker compose up -d --build
```

- API: http://localhost:8000  
- Health: http://localhost:8000/health  
- OpenAPI docs: http://localhost:8000/docs  
- MinIO console: http://localhost:9001  
- Redis: localhost:6379 (broker for Celery)

Tables are created on API startup (`create_all`). For Postgres migrations:

```bash
docker compose exec api alembic upgrade head
```

## Celery worker (Phase 5)

Compose starts `redis`, `worker`, and `beat` alongside `api`. Artifacts are shared via the `docsaas_artifacts` volume (`/app/.runtime`).

Run a worker locally (Redis must be up, e.g. `docker compose up -d redis`):

```bash
cd backend
# Windows: .venv\Scripts\activate
export CELERY_BROKER_URL=redis://127.0.0.1:6379/0
export CELERY_RESULT_BACKEND=redis://127.0.0.1:6379/0
celery -A app.worker.celery_app:celery_app worker -l info
```

Optional beat (hourly cleanup of job dirs older than `ARTIFACT_TTL_HOURS`, default 24):

```bash
celery -A app.worker.celery_app:celery_app beat -l info
```

Unit tests set `CELERY_TASK_ALWAYS_EAGER=true` so Redis is not required.

Job API (JWT):

```bash
curl -s -X POST http://localhost:8000/api/v1/jobs \
  -H "Authorization: Bearer <TOKEN>" \
  -F "template=@tests/fixtures/docx/flat_tags.docx" \
  -F 'rows=[{"ClientName":"A","ContractDate":"2026-01-01"},{"ClientName":"B","ContractDate":"2026-02-02"}]' \
  -F "output=docx"

curl -s http://localhost:8000/api/v1/jobs/<JOB_ID> \
  -H "Authorization: Bearer <TOKEN>"

curl -s -o result.zip http://localhost:8000/api/v1/jobs/<JOB_ID>/download \
  -H "Authorization: Bearer <TOKEN>"
```

Payload (`template.docx` + `rows.json`) lives under `.runtime/jobs/{org}/{job}/` — not in Redis.
Cleanup only deletes under that jobs root; it never drops users/PII tables.

## Generate / analyze (Phase 2)

1. Register and copy the JWT:

```bash
curl -s -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"org_name\":\"Demo\",\"email\":\"demo@example.com\",\"password\":\"password123\",\"full_name\":\"Demo\"}"
```

2. Fill a DOCX template (multipart `template` + JSON string `context`):

```bash
curl -s -X POST http://localhost:8000/api/v1/generate/docx \
  -H "Authorization: Bearer <TOKEN>" \
  -F "template=@tests/fixtures/docx/flat_tags.docx" \
  -F "context={\"ClientName\":\"ACME\",\"ContractDate\":\"2026-09-22\"}" \
  -o filled.docx
```

3. Same input → PDF (dxpdf in-process):

```bash
curl -s -X POST http://localhost:8000/api/v1/generate/pdf \
  -H "Authorization: Bearer <TOKEN>" \
  -F "template=@tests/fixtures/docx/flat_tags.docx" \
  -F "context={\"ClientName\":\"ACME\",\"ContractDate\":\"2026-09-22\"}" \
  -o filled.pdf
```

4. List Jinja/docxtpl tags:

```bash
curl -s -X POST http://localhost:8000/api/v1/templates/analyze \
  -H "Authorization: Bearer <TOKEN>" \
  -F "template=@tests/fixtures/docx/flat_tags.docx"
```

Regenerate binary fixtures:

```bash
cd backend
python tests/fixtures/docx/build_fixtures.py
python tests/fixtures/data/build_fixtures.py
```

## Data connectors (Phase 3)

JWT required. Unified Dataset shape: `{source, columns, rows, meta}`.

```bash
# Excel / CSV upload
curl -s -X POST http://localhost:8000/api/v1/data/excel \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@tests/fixtures/data/sample.xlsx"

# Google Sheets (needs GOOGLE_SERVICE_ACCOUNT_JSON)
curl -s -X POST http://localhost:8000/api/v1/data/google \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"spreadsheet_id\":\"...\",\"range\":\"Sheet1!A1:Z\"}"

# Yandex Tables via Disk download (YANDEX_SHEETS_TOKEN or YANDEX_DISK_TOKEN)
curl -s -X POST http://localhost:8000/api/v1/data/yandex \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"spreadsheet_id\":\"disk:/tables/registry.xlsx\",\"range\":\"Sheet1\"}"

# Unified aggregate
curl -s -X POST http://localhost:8000/api/v1/data/aggregate \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"source\":\"google\",\"spreadsheet_id\":\"...\",\"range\":\"Sheet1\"}"
```

**152-ФЗ:** Google Sheets is an intentional compliance risk for Russian personal data.
Prefer Yandex Tables or local Excel/CSV for ПДн. Connectors never log full sheet contents.

Env: `DATA_MAX_ROWS` (default 5000), `GOOGLE_SERVICE_ACCOUNT_JSON` (path or inline JSON),
`YANDEX_SHEETS_TOKEN` / `YANDEX_DISK_TOKEN`.

## Run tests (no Docker / no live Google/Yandex)

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
pytest -q
```

Tests use SQLite in-memory (`PII_SCHEMA` empty so PII tables share the default schema).
Google/Yandex unit tests mock httpx / injectable `request_fn`.

## Layout

- `app/models/` — public + `pii` ORM models  
- `app/services/pii_service.py` — only gateway to personal data + audit  
- `app/services/s3_storage.py` — MinIO/S3 presign  
- `app/services/doc_engine/` — docxtpl render + dxpdf PDF  
- `app/services/template_analyzer.py` — OOXML tag extraction  
- `app/services/connectors/` — Excel/CSV, Google, Yandex, aggregator  
- `app/worker/` — Celery app + generation/cleanup tasks  
- `app/api/routers/jobs.py` — batch job API  
- `alembic/versions/001_initial.py` — additive migration (no DROP)
- `alembic/versions/002_jobs.py` — jobs table (additive)
