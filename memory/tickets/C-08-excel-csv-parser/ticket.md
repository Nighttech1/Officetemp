### [C-08] Парсер Excel/CSV → JSON
- **Зона:** Excel Parser (фаза 3.1)
- **Факт:** Нет загрузки реестров .xlsx/.csv в JSON для генерации.
- **Ожидание:** `POST /api/v1/data/excel` (JWT) → нормализованные rows; pandas/openpyxl; utf-8/cp1251 CSV; лимит строк из конфига.
- **Приоритет:** P0
- **Зона:** Excel Parser | Backend
