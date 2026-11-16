# C-602 — Subject rights / ПДн

## Done
- `GET/PATCH /api/v1/profile/me`
- `GET /api/v1/profile/me/export`
- `POST /api/v1/profile/me/erase` + deactivate user + access_audit
- `PII_RETENTION_DAYS` + Celery `cleanup_pii_retention`

## Guard
- `pytest tests/test_profile.py` — get/patch/export/erase + login blocked after erase
