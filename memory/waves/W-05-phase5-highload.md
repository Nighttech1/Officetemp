# Волна W-05 — итог

**Статус:** закрыта (5.1–5.3)  
**Проверки:** pytest **46 passed** (eager Celery, без Redis)  
**Compose:** redis + worker + beat описаны (Docker на хосте может отсутствовать)

| Тикет | Результат |
|-------|-----------|
| C-15 | jobs API + Celery task |
| C-16 | ZIP download |
| C-17 | cleanup 24h artifacts only |

**Остаток фазы 5:** 5.4 load, 5.5 prod, 5.6 E2E CI, 5.7 a11y, 5.8 forms — следующие волны.  
**Data-safety:** cleanup только `.runtime/jobs`, не БД/ПДн.
