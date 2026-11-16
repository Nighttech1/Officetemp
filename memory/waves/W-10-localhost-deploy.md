# Localhost deploy — 2026-09-23

**Среда:** без Docker (нет в PATH).  
**API:** `http://127.0.0.1:8000` — uvicorn + SQLite `docsaas_local.db` + `CELERY_TASK_ALWAYS_EAGER`  
**Frontend:** `http://127.0.0.1:3000` — `next dev`  
**Health:** `GET /health` → ok  
**Assets:** `npm run optimize-assets` выполнен  

Roadmap фазы 1–5 закрыты в чеклисте; VPS ждёт «да» Клиента. Следующий продуктовый шаг — рекламный лендинг (W-09 skills готовы, страница ещё не собрана).
