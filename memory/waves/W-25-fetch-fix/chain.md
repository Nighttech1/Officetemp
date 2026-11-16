# W-25 — Failed to fetch generate/docx у пользователя

## Root cause
Браузер бьёт напрямую в `http://127.0.0.1:8001` (cross-origin с `:3010`). У части сессий это даёт сырой `Failed to fetch`, хотя health/generate с сервера ок.

## Fix
Same-origin: фронт ходит на `/api/v1/...` → Next rewrite → `API_PROXY_TARGET` (8001). CORS больше не нужен для кабинета.

## chain
1. Frontend — next.config rewrites + getApiBase same-origin
2. Deployer — restart Next 3010, API 8001 (venv)
3. Tester — Playwright: generate через `/api/v1/generate/docx`, скачать DOCX
4. Client — приёмка до скачанного файла
