### [C-02] Схема БД + изоляция ПДн (152-ФЗ)
- **Зона / Экран:** Backend + Personal-Data DB (фаза 1.2)
- **Факт:** Нет таблиц Organizations/Users/Templates/GenerationLogs и отдельного контура ПДн.
- **Ожидание:** Additive Alembic-миграция создаёт app-таблицы с `organization_id`; email/ФИО/телефон — в схеме `pii` без смешивания с Templates/GenerationLogs; RLS/tenant-scope на запросах; audit доступа к ПДн.
- **Приоритет:** P0
- **Скрин-улика:** n/a; проверка — миграция + тесты изоляции тенантов
- **Зона:** Backend | Personal-Data DB
