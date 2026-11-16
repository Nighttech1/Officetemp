# chain W-26 — ИУЛ конструктор (C-61, C-62, C-63)

1. **Frontend** — `docs-store` (`iulWizard`), `iul-hash.ts`, `InfoSheetWizard` + `InfoSheetLivePreview`, страница info-sheet
2. **Frontend** — `jspdf` + `iul-pdf.ts`, кнопка «Сформировать PDF», скачивание
3. **Тестировщик** → **Фиксер** → **Деплоер** (localhost) → **Клиент**

Overlapping paths: только `frontend/lib/docs-store.ts`, `frontend/components/docs/*`, `frontend/app/app/documents/info-sheet/*`, `frontend/package.json`. Backend/Motion/AI Bridge — не вызывать.
