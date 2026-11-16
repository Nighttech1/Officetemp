# C-58 — Failed to fetch generate/docx (cross-origin :8001)

**Priority:** P0 · **Wave:** W-25 · **Status:** done

### Симптом
Сообщение: `Нет связи с API (http://127.0.0.1:8001/api/v1/generate/docx)… Failed to fetch`

### Fix
Same-origin: браузер → `http://127.0.0.1:3010/api/v1/...` → Next rewrite → API `:8001`.
