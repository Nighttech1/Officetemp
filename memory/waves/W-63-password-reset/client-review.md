# W-63 Client review — восстановление пароля

## Вердикт
**ПРИНЯТО С ЗАМЕЧАНИЯМИ** (localhost готов; VPS — после «да»)

Не пишем «согласовано» на prod: SSH не выполнялся (нужно явное «да»).

## Где смотрел
- API http://127.0.0.1:8005 — register → forgot → reset → login new password
- FE http://127.0.0.1:3000 — `/login` («Забыли пароль?»), `/forgot-password`, `/reset-password`, `/privacy`
- pytest `test_password_reset.py` — 4 passed; regression profile+workspace — 10 passed
- Alembic head = `005_password_reset`

## Замечания (не P0)
- На localhost без SMTP ссылка сброса видна при `DEBUG=true` (ожидаемо). На VPS нужен SMTP и `DEBUG=false`.
- Временные логины `admin1`/`admin2` без email-формата через forgot не проходят (нужен настоящий email аккаунта) — ок.

## C-* закрыты с guards
- C-631, C-632, C-633

## Следующий шаг
Сказать **«да»** для деплоя на VPS — тогда Deployer пойдёт по `docs/VPS_READINESS.md` / `docs/RELEASE.md`.
