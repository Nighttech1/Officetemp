# W-24 — Failed to fetch на скачивании + правило Клиента про DOCX

## Тикеты
- C-56 P0 generate Failed to fetch
- C-57 P0 правило Клиента: скачать и сравнить с оригиналом

## Root cause (предварительно)
1. `generateDocx`/`generatePdf` не вызывали `ensureDevSession` → при протухшем JWT/сетевой ошибке браузер показывает сырой `Failed to fetch`.
2. В поле Google часто попадает битый id (`…xa3…Com4…` → export 404). Рабочий id: `…xo3…CCom4…`.
3. Клиент ранее мог закрывать приёмку без реального скачивания файла.

## chain.md
1. Frontend — api.ts ensureDevSession + понятные сетевые ошибки; Wizard при необходимости.
2. Documentation/rules — client.mdc + client-review (C-57).
3. Tester — Playwright шаги 1–4, download DOCX, guard с размером и сравнением с шаблоном.
4. Fixer → Deployer localhost → Client.
