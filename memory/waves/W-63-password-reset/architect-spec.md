# W-63 — Восстановление пароля

## Acceptance
1. На `/login` есть «Забыли пароль?»
2. `POST /api/v1/auth/forgot-password` всегда 200 (без раскрытия, есть ли email)
3. Одноразовый токен (хеш в БД), TTL ≤ 60 мин
4. `POST /api/v1/auth/reset-password` меняет bcrypt-хеш, инвалидирует токен
5. Письмо при SMTP; без SMTP — ссылка в лог API (dev) + опционально в ответе только если `DEBUG=true`
6. Обновить `/privacy`

## Chain
Архитектор → Backend → Frontend → Tester → Client
