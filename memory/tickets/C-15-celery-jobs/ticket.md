### [C-15] Celery + Redis: фоновая пакетная генерация
- **Зона:** Backend / Doc Engine (фаза 5.1)
- **Факт:** Генерация синхронная в HTTP — не выдержит сотни документов.
- **Ожидание:** `POST /api/v1/jobs` ставит задачу; worker Celery рендерит DOCX/PDF; `GET /api/v1/jobs/{id}` статус/прогресс; Redis в compose; идемпотентность по job_id+row_id.
- **Приоритет:** P0
- **Зона:** Backend | Doc Engine | Deploy
