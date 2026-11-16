# Load report — W-06 / C-18

- **mode:** `inprocess`
- **rows:** 1000
- **wall_seconds:** 32.389
- **rows_per_sec:** 30.87
- **success:** True
- **job_id:** a120a828-6a54-46c8-acb1-025215be5e44
- **zip_files:** 1000
- **api:** in-process TestClient

Notes:
- In-process / eager Celery does not need Redis.
- For `--rows 1000` against a live worker, Redis + celery worker are recommended unless `CELERY_TASK_ALWAYS_EAGER=true`.
