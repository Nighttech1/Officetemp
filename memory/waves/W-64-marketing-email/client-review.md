# W-64 Client review — marketing email

## Вердикт
**ПРИНЯТО** (localhost). Архитектура рекламных рассылок добавлена; раньше её не было.

## Ответ на вопрос
Нет, раньше не было учтено (только контактная форма и сброс пароля). Теперь учтено: отдельный opt-in, кампании HTML/баннеры, Celery, отписка, политика.

## Где смотрел
- pytest marketing + profile + password_reset
- Live API :8005 register with marketing_opt_in → campaign
- FE :3000 register / unsubscribe / privacy

## Замечания
- Без SMTP кампания идёт в dry_run (лог) — на VPS нужен SMTP.
- Админ-UI конструктора баннеров — вне scope (API готов).

## C-*
C-641, C-642, C-643 закрыты с guards.
