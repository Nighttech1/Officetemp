# Architect Spec — W-05 High-load core (Celery / ZIP / cleanup)

## Scope (≤3)
C-15 Celery jobs, C-16 ZIP, C-17 24h cleanup.

**Out of this wave:** 5.4 load test 1000+, 5.5 prod VPS, 5.6 Playwright CI, 5.7 a11y, 5.8 forms/mail, Payment Processor (нет биллинга в тикетах волны).

## Stack
- Redis (compose service `redis`)
- Celery worker + optional beat
- FastAPI job API
- Doc Engine `render_docx` / `convert_docx_to_pdf` (dxpdf) inside tasks
- Artifacts under `backend/.runtime/jobs/{org_id}/{job_id}/` (gitignore)

## Data model (additive)
Prefer reuse `GenerationLog` **or** new table `jobs`:
- id, organization_id, created_by, status (queued|running|done|failed|expired)
- total_rows, done_rows, error
- zip_path / result_key
- created_at, updated_at

Alembic additive only if Postgres; for SQLite local `create_all` / migration optional with SQLAlchemy model.

## API
- `POST /api/v1/jobs` — body: template bytes ref OR multipart template + `rows: list[dict]` (+ `output: docx|pdf|both`) → `{job_id}`
- `GET /api/v1/jobs/{id}` — status, progress percent, error
- `GET /api/v1/jobs/{id}/download` — ZIP when done (401/404/409 if not ready)

## Celery
- Broker/result: `redis://redis:6379/0` (local `redis://127.0.0.1:6379/0`)
- Tasks: `run_generation_job(job_id)`, `cleanup_expired_artifacts`
- Eager mode for unit tests: `CELERY_TASK_ALWAYS_EAGER=true`
- Idempotent: skip row if output file already exists for row_id

## ZIP
- After all rows: zip docx/pdf into `result.zip`
- Do not put PII in zip filename beyond org/job UUIDs

## Cleanup 24h
- Beat schedule hourly OR callable from API admin stub + pytest freezegun/mtime trick
- Delete artifact dirs where `mtime` or job.created_at older than 24h
- Set status `expired`
- **Never** DROP tables / wipe Users / PII

## Compose
```yaml
redis:
  image: redis:7-alpine
worker:
  build: backend
  command: celery -A app.worker.celery_app worker -l info
beat:
  command: celery -A app.worker.celery_app beat -l info
```
API env: `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`, `ARTIFACT_TTL_HOURS=24`

## Frontend (minimal, if time)
Poll job status on `/app/generate` — optional; API-first acceptance OK for this wave.

## Chain
Архитектор → Backend (+ Doc Engine tasks) → Deployer (compose redis/worker) → Тестировщик → Фиксер → Клиент
