---
name: yandex-sheets
description: >-
  Коннектор Яндекс Таблиц API для РФ-рынка и 152-ФЗ. Use when integrating Yandex
  Spreadsheets as a data source for templates and batch document generation.
---

# Yandex Tables Connector

## Правила

1. OAuth / API-ключ только из секретов окружения.
2. Read-only по умолчанию; запись — отдельное явное право в RBAC.
3. Нормализация строк → JSON как у Excel/Google через Data Aggregator.
4. Хостинг и логи — в РФ-контуре (Yandex Cloud / Selectel / VK Cloud).
5. При недоступности API — fallback на загруженный Excel того же маппинга, если пользователь разрешил.

## Связи

Data Aggregator, Backend, Doc Engine, Security (аудит доступов).
