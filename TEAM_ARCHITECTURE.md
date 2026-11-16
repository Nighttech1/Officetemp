# Team Architecture — шаблон сильной команды агентов

Переносимая командная база: роли, skills, MCP, plugins и **универсальная** knowledge.

**Как перенести в новый сайт:** [`COPY_TO_NEW_PROJECT.md`](../COPY_TO_NEW_PROJECT.md) (в корне этой папки).

Домен конкретного продукта в `knowledge/` не хранится. Для новой зоны копируйте `knowledge/area_example/` в целевой проект.

Профиль команды: **Doc SaaS** (DOCX/PDF, FastAPI, коннекторы таблиц, No-code кабинет) + опционально luxury web / Cortana.  
Реестр: `.cursor/registry/agents.md`. Готовность: `TEAM_READY.md`.  
Motion/WebGL / Cortana — только по `chain.md`.

## Контуры

```mermaid
flowchart LR
  U[Пользователь] --> O[Оркестратор]
  O --> TR[Тренер]
  TR --> A[Архитектор]
  O --> FE[Фронтендер]
  O --> M[Motion]
  O --> BE[Бекендер]
  O --> X[WebGL / новые агенты]
  FE --> T[Тестировщик]
  M --> T
  BE --> T
  X --> T
  T --> F[Фиксер]
  F --> D[Деплоер / localhost]
  D --> C[Клиент]
  C -->|C-*| O
  U -->|правки / не то| TR
```

**Тренер** — каждый ход: план → грейд команды → skills/rules/plugins/MCP. При правках пользователя — gap знаний до инженерии.

## Что делает команду сильной

| Слой | Где лежит |
|------|-----------|
| Rules ролей | `.cursor/rules/` |
| Skills | `.cursor/skills/` + `.agents/skills/` |
| MCP | `.cursor/mcp.json`, `scripts/mcp/` |
| Plugins | `plugins/` ролей команды |
| Knowledge | `knowledge/engineering/`, `knowledge/area_example/` |
| Цикл | `docs/CLIENT_ORCHESTRATOR_CYCLE.md`, `promts`, `.cursor/prompts/` |
| Журнал | `memory/_templates/` |

## Расширение команды

Новых агентов складываем сюда же: rule + skill + строка в `.cursor/registry/agents.md` + при нужде оболочка в `knowledge/engineering/roles/`.
После регистрации они входят в команду Оркестратора.

## Жёсткие правила цикла

- Архитектор пишет spec + `chain.md` до кода.
- Оркестратор зовёт роли только по chain.
- Максимум 3 тикета `C-*` за проход.
- Закрытие только с guard.
- VPS/prod после Клиента без P0/P1 и явного согласования.
