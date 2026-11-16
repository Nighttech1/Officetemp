# C-633 — Privacy + VPS readiness (password reset)

## Done
- Privacy updated (W-63)
- `.env.production.example`: `PUBLIC_APP_URL` + SMTP notes
- Localhost migrate 005 applied; API :8005 + FE :3000

## Guard / VPS note
Перед SSH на VPS: задать `PUBLIC_APP_URL=https://DOMAIN`, SMTP_*, `DEBUG=false`.
SSH/prod — только после явного «да» от заказчика.
