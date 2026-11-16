# Плагины — trainer (Тренер)

Каталог карточек и хелперов для усиления команды (не продукт).

## Как добавить

1. Карточка источника скилла/MCP/плагина → таблица ниже.
2. При установке MCP — правка `.cursor/mcp.json` + секрет в `.env` при нужде.
3. Обнови `.cursor/registry/agents.md` если появился новый инструмент для роли.

## Реестр источников (стартовый)

| Name | Type | URL / path | When to use | Notes |
|------|------|------------|-------------|-------|
| gap-playbook | skill ref | `.cursor/skills/trainer/gap-playbook.md` | после правок пользователя | живая таблица пробелов |
| create-skill | Cursor skill | `~/.cursor/skills-cursor/create-skill` | новый SKILL.md | формат frontmatter |
| create-rule | Cursor skill | `~/.cursor/skills-cursor/create-rule` | новое `.mdc` | |
| agents registry | docs | `.cursor/registry/agents.md` | грейд команды | |
| MCP config | config | `.cursor/mcp.json` | нехватка browser/HF/21st/payments | секреты не в git |
| landing skills catalog | docs | `.agents/skills/LANDING_SKILLS_SOURCES.md` | лендинг-волны | |
| OWASP playbook | skills | `.agents/skills/*security*` | второй цикл | не в обычной фазе |
| 21st MCP | plugin | `plugins/twentyfirst/PLUGINS.md` | UI-каталог | ключ `API_KEY_21ST` |

## Secrets

Ключи API (21st, HF, ЮKassa…) — только `.env` / Cursor Secrets.
