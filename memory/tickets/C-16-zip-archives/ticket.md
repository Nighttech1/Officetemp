### [C-16] Сборка ZIP-архива готовых документов
- **Зона:** Backend / Doc Engine (фаза 5.2)
- **Факт:** Нет упаковки пакета файлов в один ZIP.
- **Ожидание:** после batch job — ZIP в runtime/S3 path; `GET /api/v1/jobs/{id}/download` отдаёт zip; tenant-scoped.
- **Приоритет:** P0
- **Зона:** Backend | Doc Engine
