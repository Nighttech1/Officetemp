---
name: template-analyzer
description: >-
  Анализ загруженного .docx: извлечение Jinja/docxtpl тегов для Visual Mapper.
  Use when parsing Word templates, listing placeholders, or validating mapping UI.
---

# Template Analyzer

## Цель

По загруженному `.docx` вернуть список всех тегов (`{{ ... }}`, `{% ... %}`), чтобы фронтенд показал маппинг колонок таблицы → поля шаблона.

## Правила

1. Парсить OOXML / текст runs; учитывать теги, разорванные между `w:t` (склеивать соседние runs в параграфе).
2. Классифицировать: scalar / loop (`for`) / table-row (`tr for`) / conditional (`if`).
3. Не изменять файл шаблона — только read + JSON-отчёт.
4. Дубликаты тегов дедуплицировать, сохранив `count` и пример location (paragraph/table index).

## Контракт ответа API (ориентир)

```json
{
  "tags": [
    { "name": "ClientName", "kind": "var", "raw": "{{ ClientName }}" },
    { "name": "items", "kind": "tr_for", "raw": "{% tr for item in items %}" }
  ]
}
```

## Связи

Doc Engine (рендер), Frontend Visual Mapper, Data Aggregator (типы полей).
