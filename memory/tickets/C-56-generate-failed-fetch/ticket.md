# C-56 — Шаг 4: скачивание DOCX → «Failed to fetch»

**Priority:** P0 · **Wave:** W-24 · **Status:** done

### Симптом
На шаге «Генерация» кнопка скачать DOCX показывает ошибку `Failed to fetch`. Файл не скачивается.

### Ожидание
1. `POST /api/v1/generate/docx` с живого кабинета (`:3010` → API `:8001`) всегда проходит при валидном шаблоне и данных.
2. Перед генерацией клиент гарантирует JWT (`ensureDevSession`), как на шагах analyze/cloud.
3. При сетевой ошибке — понятное сообщение на русском (не сырой `Failed to fetch`).
4. Playwright доводит сценарий до **реального скачивания** файла и пишет размер/путь в guard.

### Зона
Frontend `lib/api.ts` + `WaybillWizard.tsx`; при необходимости Backend generate / CORS / деплой API:8001.
