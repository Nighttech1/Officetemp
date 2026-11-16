# Architect — W-43 C-99 шрифты PDF ИУЛ

## Проблема
`frontend/lib/iul-pdf.ts` использует `doc.setFont("helvetica", …)`. Helvetica в jsPDF **не содержит кириллицу** → в скачанном PDF русские символы ломаются.

## Решение
1. Встроить TTF с кириллицей (DejaVu Sans + Bold) в PDF через `addFileToVFS` / `addFont`.
2. Все `setFont("helvetica", …)` заменить на встроенный семейный шрифт.
3. Шрифты лежат в `frontend/public/fonts/` (доступ по `/fonts/…`); загрузка один раз, кэш на модуле.
4. `buildIulPdfBlob` → `async` (загрузка шрифта); вызовы в `InfoSheetWizard` — `await`.

## Вне scope
- Бэкенд-генерация PDF, смена вёрстки таблиц, смена шаблона ИУЛ.

## Приёмка
Скачать PDF ИУЛ с русским объектом/наименованием → в Adobe/браузере текст читается; не кракозябры.
