# C-632 — Password reset UI

## Done
- `/forgot-password` — форма email
- `/reset-password?token=` — новый пароль
- Ссылка «Забыли пароль?» на `/login` и в LoginPopover
- `lib/api.ts`: `forgotPassword` / `resetPassword`
- `/privacy` — раздел про восстановление пароля

## Guard
HTTP 200: `/login`, `/forgot-password`, `/reset-password`, `/privacy` on http://127.0.0.1:3000
DOM: login содержит «Забыли пароль?»
