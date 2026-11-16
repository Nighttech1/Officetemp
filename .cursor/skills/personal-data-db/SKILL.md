---
name: personal-data-db
description: >-
  Отдельная БД/схема персональных данных (152-ФЗ): изоляция PII, шифрование,
  RLS, минимизация, сроки хранения, audit log. Use when designing or changing
  user PII storage, consent, export/erase (право на забвение).
---

# Personal Data DB (ПДн)

## Зона ответственности

Только **личные данные пользователей** (ФИО, email, телефон, паспортные поля, платёжные идентификаторы клиента — не PAN карты).  
Бизнес-данные шаблонов/генерации — зона Backend / основной Postgres. ПДн — отдельная БД или отдельная схема + жёсткий ACL.

## Правила 152-ФЗ (рабочие)

1. **Минимизация:** хранить только нужные поля; запрет «на всякий случай».
2. **Изоляция:** отдельный database/schema `pii_*`; приложение ходит через узкий API Personal-Data service, не через общий ORM dump.
3. **Шифрование:** at-rest (диск/TDE или column-level для чувствительных), TLS in-transit; ключи — в secret store, не в репо.
4. **Доступ:** RBAC + audit log кто читал ПДн; запрет логировать сырые ПДн.
5. **Сроки:** TTL/политики удаления; право субъекта на выгрузку и удаление.
6. **Миграции:** только additive через `safe-db-migrations`; без DROP живых ПДн без явной команды пользователя.
7. **Тенанты:** `organization_id` / subject id на каждой строке; cross-tenant SELECT = P0.

## Стек-ориентиры

- PostgreSQL + RLS-паттерны из `.agents/skills/supabase-postgres-best-practices`
- Миграции: Alembic (`plugins/db-admin/alembic`) + `safe-db-migrations`
- Пользователи/auth: `plugins/user-accounts/fastapi-users` (связка id, не дублировать ПДн в app DB)

## Связи

Backend (ссылки `user_id` без копирования ПДн), Payment Processor (customer contact для чека — минимально), Security (аудит 152-ФЗ во втором цикле).

`🗄️ **PERSONAL-DATA DB:** [схема / изоляция / audit]`
