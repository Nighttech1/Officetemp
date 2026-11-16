# C-603 — Workspace files on server

## Done
- Snapshot `templateStorageKey` / `dataFileStorageKey`
- `expected_revision` → HTTP 409 on conflict
- `POST/GET /api/v1/storage/objects` (MinIO or local `.runtime/blobs` fallback)
- Frontend: upload on saveDocTemplate/data; hydrate blobs on login pull
- Policy: source PDF ИУЛ never stored (stripped in workspace_service)

## Guard
- `pytest tests/test_workspace.py` + `tests/test_storage.py`
- E2E «другой браузер видит Word» — после Docker MinIO/Postgres (см. client-review)
