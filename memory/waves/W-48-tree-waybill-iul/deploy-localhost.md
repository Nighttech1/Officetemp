# Deploy localhost — W-48

- Frontend: Next.js `http://127.0.0.1:3000`
- API: uvicorn `http://127.0.0.1:8001` (rewrite `/api/v1` → 8001)
- AuthGate: UI открывается ≤4с; sync workspace в фоне (422 snapshot не блокирует кабинет)
- Проверено Playwright: дерево, ИУЛ→данные→стыковка→DOCX/PDF скачаны в `artifacts/`
