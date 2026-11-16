# C-604 — Local disk blobs for VPS

## Done
- `STORAGE_BACKEND=local` prod-default
- Compose volume `docsaas_blobs`; MinIO optional profile
- Docs: `FILE_STORAGE.md`, updated `VPS_READINESS.md` / roadmap 6.3.4 / 6.4.1 / 6.4.5

## Guards
- `pytest tests/test_storage.py` — local upload + cross-org 403 + empty workspace for other org
- Live localhost: Org B gets 403 on Org A key; B workspace empty; A downloads own file
