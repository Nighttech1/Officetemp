### [C-10] Data Aggregator — единый JSON
- **Зона:** Data Aggregator (фаза 3.4)
- **Факт:** Нет единого контракта `source/columns/rows/meta` для всех источников.
- **Ожидание:** `normalize(source) → Dataset`; `POST /api/v1/data/aggregate` принимает excel upload ИЛИ connector ref; один JSON для Doc Engine.
- **Приоритет:** P0
- **Зона:** Data Aggregator | Backend
