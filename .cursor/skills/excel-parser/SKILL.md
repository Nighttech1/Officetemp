---
name: excel-parser
description: >-
  Парсинг Excel/CSV реестров (pandas/openpyxl) в JSON-массивы для Doc Engine.
  Use when ingesting 1C exports, spreadsheets, or static registries for generation.
---

# Excel Parser

## Стек

- `pandas` / `openpyxl` для `.xlsx`
- CSV: utf-8 / cp1251 с авто-детектом BOM

## Правила

1. Первая строка — заголовки; нормализовать имена колонок (trim, единый регистр ключей в JSON).
2. Пустые строки в конце отбрасывать; типы: даты → ISO-8601, числа без локали-мусора.
3. Лимит размера файла и строк — из конфига Backend; при превышении — понятная ошибка, не OOM.
4. Выход — массив объектов `list[dict]` для Data Aggregator / Doc Engine.
5. Не писать исходный файл в публичный URL; хранить в tenant-scoped storage.

## Связи

Data Aggregator, Backend upload API, Doc Engine batch.
