# Чеклист W-82 — Preview + Sheets (для Frontend / Google Sheets)

## Preview (C-820 / C-821)

- [ ] После `renderAsync` ширина контента ≤ clientWidth контейнера (или scale fit).
- [ ] Вертикальная панель: `+` / `−` / fit / pan.
- [ ] В DOM есть непустые header/footer (или `.docx-header` / `.docx-footer`) с текстом из шаблона.
- [ ] `overflow` окна не обрезает колонтитулы по вертикали без возможности pan.

## Sheets (C-822)

- [ ] Нет connect на `onBlur` / `onPaste` (paste только вставляет текст).
- [ ] Connect только `onClick` кнопки.
- [ ] Во время запроса: текст «подключаемся…» + единый animated green contour вокруг input+button.
- [ ] Успех → `rows.length > 0` и/или `sheetNames`; ошибка → StatusMessage, не тихий fail.
