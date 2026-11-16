---
name: google-sheets
description: >-
  Коннектор Google Sheets API (OAuth 2.0 / Service Account) для чтения реестров.
  Use when connecting Google spreadsheets as a live data source for document generation.
---

# Google Sheets Connector

## Правила

1. Секреты только в `.env` / secret store; не логировать токены и spreadsheet с ПДн целиком.
2. Предпочитать read-only scopes; Service Account — для серверных интеграций org.
3. Диапазон чтения конфигурируемый (`Sheet1!A1:Z`); заголовки → ключи JSON.
4. Ошибки квот/доступа — явные коды для UI, без ретраев в бесконечном цикле.
5. Выход нормализовать через Data Aggregator (тот же контракт, что у Excel Parser).

## UX мастера: connect по ссылке (жёстко)

1. **Только кнопка** «Подключить» запускает `from-url` / `fetchCloudTable`. Запрещены auto-connect на `blur`, `paste`, debounce после ввода.
2. Paste — только вставляет текст в поле; пользователь сам жмёт кнопку.
3. Пока идёт запрос: текст кнопки **«подключаемся…»** + единый animated green contour вокруг группы «поле + кнопка». **Не** дублировать отдельной StatusMessage-плашкой «Подключаемся… подождите».
4. Подсказка под полем: явно писать **ожидаемое время подключения** (цель **до 15–30 с** на типичную таблицу; не минуты).
5. **SLA:** полный connect (download+parse+ответ API) целевой **&lt; 30 с** для публичной Google-ссылки. Полный `.xlsx` + openpyxl по всем листам на многомегабайтных книгах — **запрещённый** путь; предпочитать **CSV/gviz** или один read_only лист. Минуты ожидания = P0 баг коннектора (роль Google Sheets + Backend), не «норма prod».
6. Путь данных: публичный export → явная ошибка или SA fallback; UI показывает detail.
7. **gid ≠ OOXML sheetId:** `xl/workbook.xml` `sheetId` (1,2,3,4…) — это НЕ Google `gid` из URL. CSV только через `gviz/tq?tqx=out:csv&sheet={Name}` (имя вкладки) или реальный `gid` из HTML scrape / `#gid=` в ссылке. `export?format=csv&gid=<sheetId>` → HTTP 400 при «Редактор по ссылке» = баг коннектора, не прав доступа.
8. **Быстрый путь (обязателен):** если в URL есть реальный Google `#gid=` / `?gid=` **или** UI передал `sheet_name` — **запрещено** скачивать полный `.xlsx` для списка листов. Сразу:
   `export?format=csv&gid={gid}` или `gviz/tq?tqx=out:csv&sheet={Name}`.
   Цель SLA: **300–800 ms** на публичный CSV одного листа (не 15–30 с).
9. **TTL cache** in-memory 30–60 с на ключ `(spreadsheet_id, gid|sheet_name)` — повторные connect/generate не дергают Google.
10. Эталонный лист накладных: `Журнал выдачи ПД 2026` / gid `124580750` (книга `1vI8fUt1GrdYT1J4xryJl5Mr8MF782hov7dIBdkLR-Mo`).

## 152-ФЗ

Для ПДн граждан РФ Google Sheets — осознанный риск; предпочитать Яндекс Таблицы / локальный Excel, если клиент требует РФ-контур.
