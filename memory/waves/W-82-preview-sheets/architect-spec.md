# Architect spec — W-82

## Цель

Исправить live-preview накладной (fit + zoom/pan + колонтитулы) и шаг 2 подключения Google Sheets по ссылке (UX + фактическая загрузка данных) на localhost.

## Границы

- В scope: `WaybillLivePreview`, CSS превью, `WaybillWizard` cloud block, `fetchCloudTable`, `cloud_url.py` / `data.from-url`.
- Вне scope: лендинг, Motion/WebGL, prod VPS, OAuth пользователя Google (остаёмся на public export + SA).
- Security/Hacker не в этой волне.

## C-820 — Fit + zoom/pan

**Подход:** после `renderAsync` измерить natural width секции/wrapper vs clientWidth host; применить `transform: scale(fit)` + `transformOrigin: top left`; хранить `userZoom` множитель. Контейнер: `overflow: auto` (или pan offset через translate). Вертикальная toolbar справа/слева внутри frame: ZoomIn, ZoomOut, Maximize2 (fit), Move (pan toggle).

Не полагаться только на `width:100%` + `table-layout:fixed` — широкие Word-таблицы всё равно вылезают.

## C-821 — Headers/footers

Гипотезы до кода (DEBUG): DOM пуст vs clipped.  
Фикс-кандидаты после логов: опции docx-preview (`breakPages`, experimental), CSS (не `overflow-x:hidden` на предках header), явные стили `.docx-header/.docx-footer` min-height/visibility. Если generateDocx срезает колонтитулы — Doc Engine; иначе только FE renderer.

## C-822 — Sheets

1. Удалить `onBlur` → `scheduleConnectFromUrl` и auto-connect из `onPaste` (оставить trim paste).
2. Отдельный `cloudConnecting` state (не общий `busy` на весь мастер до клика) → кнопка «подключаемся…».
3. CSS `@keyframes` running green border на обёртке `.cloud-connect-contour`.
4. Починить backend path: логировать status/content-type/PK magic; улучшить SA fallback (list sheets) если export HTML; пробросить понятный HTTP detail.

## Контракты

- `POST /api/v1/data/from-url` body `{ url, sheet_name? }` → `DatasetOut` без изменений схемы.
- FE: успех → `rows` + `sheetNames` в wizard store.

## Риски

- SA не настроен → нужны публичные права «по ссылке»; UI должен сказать об этом явно.
- CDN docx-preview 0.4.1 лимиты по headers — проверить runtime DOM.