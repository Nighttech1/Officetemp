---
name: data-aggregator
description: >-
  Единый слой нормализации данных: Excel / Google / Яндекс → стандартный JSON
  для Doc Engine и Visual Mapper. Use when unifying connectors or fixing mapping bugs.
---

# Data Aggregator

## Контракт

Любой источник на выходе даёт:

```json
{
  "source": "excel|google|yandex",
  "columns": ["col_a", "col_b"],
  "rows": [ { "col_a": "...", "col_b": "..." } ],
  "meta": { "row_count": 0, "fetched_at": "ISO-8601" }
}
```

## Правила

1. Один интерфейс `fetch_normalized(source_ref) → Dataset`.
2. Маппинг UI связывает `columns` ↔ теги Template Analyzer; агрегатор не угадывает маппинг сам.
3. Для batch-генерации: одна строка реестра = один документ (или группа по ключу, если задано).
4. Валидация обязательных полей до постановки в Celery — fail-fast.
5. ПДн: не кэшировать дольше политики (фаза 5 — автоочистка 24ч).
