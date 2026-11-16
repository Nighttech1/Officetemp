# Волна W-26 — Конструктор ИУЛ

**Тикеты:** C-61, C-62, C-63 — **done**
**Localhost:** FE `http://localhost:3000`, API `http://127.0.0.1:8001`
**Артефакт PDF:** `memory/tickets/C-63-iul-generate-pdf/artifacts/iul-download.pdf` (8914 байт)

## Что сделано по ролям
1. Клиент — тикеты C-61…C-63
2. Архитектор — architect-spec + chain (Frontend only)
3. Frontend — InfoSheetWizard, hash, jspdf, page
4. Тестировщик — anti_slop OK, Playwright upload+download
5. Деплоер — next dev :3000 + uvicorn :8001
6. Клиент — приёмка до скачанного файла
