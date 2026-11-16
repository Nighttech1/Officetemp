# C-631 — Password reset API

## Done
- Alembic `005_password_reset` → table `password_reset_tokens` (SHA-256 hash only)
- `POST /api/v1/auth/forgot-password` (always 200, rate limit, no email enumeration)
- `POST /api/v1/auth/reset-password` (one-time token, bcrypt new password)
- SMTP via `send_plain_email`; without SMTP + `DEBUG=true` → `debug_reset_url`
- Config: `PUBLIC_APP_URL`, `PASSWORD_RESET_TTL_MINUTES`, `PASSWORD_RESET_RATE_PER_HOUR`

## Guard
```
cd backend
.venv\Scripts\python.exe -m pytest tests/test_password_reset.py -q
# expect: 4 passed
```
Live smoke 2026-09-30: register → forgot → reset → login new password OK on :8005
