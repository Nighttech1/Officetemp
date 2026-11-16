# Guards — C-03 JWT/RBAC + S3 storage

## Executable
```bash
cd backend && pytest tests/test_auth.py tests/test_storage.py -q
```
Expected:
- register → login → `/auth/me` with JWT
- presign-upload returns URL + key under `org/{org_id}/templates/` (S3 mocked in unit test)

## Localhost (after deploy)
Register + login against `http://localhost:8000/api/v1/auth/*`; presign against live MinIO.

## Regression class
Missing org claim in JWT / unscoped storage keys / auth bypass on protected routes.
