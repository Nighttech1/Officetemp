# Trainer grade — регистрация роли Тренер (2026-10-02)

## План хода (кратко)

- Запрос пользователя: добавить агента **Тренер** в команду; каждый ход грейдит команду; при правках — сначала gap знаний.
- Тикеты / волна: мета-задача команды (не продуктовый C-*).
- Поверхности: rules, skills, registry, cycle docs, plugins, knowledge.

## Грейд команды: A (после регистрации)

До регистрации: **D** по мета-роли (агента не было).  
После: роль встроена в цикл.

## Пробелы (закрыты этим ходом)

| # | Пробел | Роль | Слой | Критичность |
|---|--------|------|------|-------------|
| 1 | Нет агента, который усиливает команду каждый ход | Тренер | rule+skill+registry+cycle | P0 |
| 2 | Нет gap-ритуала после «не то» от пользователя | Тренер | gap-playbook | P0 |
| 3 | Цикл не требовал апгрейд skills/MCP до инженерии | Оркестратор | orchestrator.mdc + CLIENT_ORCHESTRATOR_CYCLE | P0 |

## Что добавлено этим ходом

- `.cursor/rules/trainer.mdc`
- `.cursor/skills/trainer/SKILL.md` + `gap-playbook.md`
- `knowledge/engineering/roles/trainer.md`
- `plugins/trainer/PLUGINS.md`
- `memory/_templates/trainer-grade.md`
- Обновлены: `agents.md`, `team-org.mdc`, `orchestrator.mdc`, `CLIENT_ORCHESTRATOR_CYCLE.md`, `start-client-orchestrator-cycle.md`, `TEAM_ARCHITECTURE.md`, `SECOND_SECURITY_CYCLE.md`

## Вердикт

Команда готова использовать Тренера с следующего продуктового хода: **да**  
Следующий агент: Оркестратор (при новом запросе пользователя — сначала `🎓 ТРЕНЕР`)
