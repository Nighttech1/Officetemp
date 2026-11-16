# Trainer grade — W-82 / 2026-10-03

## План хода (кратко)

- Запрос: превью fit+zoom/pan; колонтитулы; шаг 2 Sheets — только кнопка, UX «подключаемся…», починить connect по ссылке.
- Тикеты: C-820, C-821, C-822 (все P0).
- Поверхности: WaybillLivePreview + CSS; WaybillWizard cloud URL; backend cloud_url/from-url.
- Уже известно из кода: blur/paste вызывают `scheduleConnectFromUrl`; preview = docx-preview CDN с `renderHeaders/Footers: true`, но CSS `overflow-x: hidden` и нет zoom.

## Грейд команды: B

## Пробелы

| # | Пробел | Роль | Слой | Критичность |
|---|--------|------|------|-------------|
| 1 | Нет чеклиста viewport preview (fit-width + pan/zoom toolbar) | Frontend | skill | P0 |
| 2 | Нет REJECT «колонтитулы обязательны в live preview» | Frontend / Doc Engine | skill | P0 |
| 3 | Google Sheets skill не фиксирует «connect только по кнопке» + running-border UX | Google Sheets | skill | P0 |

## Что добавлено этим ходом

- Дополнен `.cursor/skills/google-sheets/SKILL.md` (button-only connect + loading contour).
- Дополнен `.cursor/skills/doc-engine/SKILL.md` секцией live-preview headers/fit (если правим рендер).
- Чеклист в `memory/waves/W-82-preview-sheets/preview-sheets-checklist.md` для Frontend.

## Gap после замечания пользователя

- Ожидали: превью целиком + колонтитулы; ручное подключение таблицы с понятным статусом и рабочим API.
- Получили: обрезка по ширине; нет zoom; колонтитулы не видны; blur auto-connect + долгий busy; connect по ссылке не даёт данных.
- Чего не хватало: жёстких чеклистов preview viewport и sheets button-only; runtime логов export/SA.
- Как закрыли: skills + DEBUG-инструментирование перед фиксом.

## Вердикт

Команда готова к Архитектору / инженерам: **да**  
Следующий агент: Архитектор