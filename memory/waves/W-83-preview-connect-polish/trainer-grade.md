# Trainer grade — W-83 / 2026-10-03

## Gap после замечания

| Ожидали | Получили | Пробел знаний |
|---------|----------|---------------|
| Клиент сам кликает всё и чинит через C-* | Отдали «проверьте сами» | Жёсткий gate: клики + запрет возвращать недоделку |
| Превью toolbar всегда кликабелен | Pan в «чёрное» → кнопки мертвы | Нет edge-case REJECT на pan/toolbar |
| Колонтитулы с картинками | Текст probe был, картинки нет | Нет проверки img в header/footer |
| Connect ~секунды | Минуты (xlsx 6MB + openpyxl) | Google Sheets skill не запрещал тяжёлый путь |

## Добавлено

- `client.mdc` / `client-review`: клики всех кнопок + edge-cases; запрет отдавать пользователю при P0/P1
- `google-sheets` skill: SLA &lt;30s, CSV/gid, без дубль-плашки

Грейд: **B** → Google Sheets + Frontend + Backend
