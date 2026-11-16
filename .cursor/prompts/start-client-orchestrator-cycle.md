# Старт цикла Клиент ↔ Оркестратор

Вставь это в новый чат проекта, куда скопирована эта командная папка.

```text
Прочитай CLIENT_ORCHESTRATOR_CYCLE.md и запусти цикл Клиент↔Оркестратор до «согласовано».

Сначала физически прочитай:
- .cursor/rules/team-org.mdc
- .cursor/rules/orchestrator.mdc
- .cursor/registry/agents.md
- .cursor/rules/trainer.mdc
- .cursor/skills/trainer/SKILL.md
- .cursor/rules/client.mdc
- .cursor/rules/architect.mdc
- .cursor/rules/frontend.mdc
- .cursor/rules/backend.mdc
- .cursor/rules/ai-bridge.mdc
- .cursor/rules/tester.mdc
- .cursor/rules/fixer.mdc
- .cursor/rules/deployer.mdc
- .cursor/rules/asset-pipeline.mdc
- .cursor/rules/playwright-e2e.mdc
- .cursor/rules/a11y-critic.mdc
- .cursor/rules/forms-mail.mdc
- .cursor/rules/devops.mdc
- .cursor/rules/security-ops.mdc
- .cursor/rules/hacker.mdc
- .cursor/rules/db-admin.mdc
- .cursor/rules/user-accounts.mdc
- .cursor/rules/payment-processor.mdc
- .cursor/rules/doc-engine.mdc
- .cursor/rules/template-analyzer.mdc
- .cursor/rules/excel-parser.mdc
- .cursor/rules/google-sheets.mdc
- .cursor/rules/yandex-sheets.mdc
- .cursor/rules/data-aggregator.mdc
- .cursor/rules/security.mdc
- .cursor/rules/documentation.mdc

Используй библиотеку команды:
- skills: .cursor/skills/
- MCP: playwright, chrome-devtools, image-compare, a11y, lighthouse
- plugins: plugins/ ролей команды
- knowledge: knowledge/engineering/ и knowledge/area_sputnik/

Цикл (запускай без уточнений и дополнительных вопросов):
1. Клиент: цель / приёмка / тикеты C-*
2. Оркестратор: волна ≤3
3. **Тренер (каждый ход первым):** смотрит локальный план волны → грейдит команду → дополняет skills/rules/plugins/MCP → trainer-grade.md. Если пользователь дал правки / «не то» — сначала gap знаний, потом инженерия.
4. Архитектор: architect-spec + chain.md до кода
5. Специалисты по chain (Фронтендер / Motion / WebGL / Бекендер / Asset Pipeline / Playwright E2E / a11y-critic / forms-mail / DevOps / Security Ops / Documentation / Doc Engine / Template Analyzer / Excel Parser / Google Sheets / Yandex Tables / Data Aggregator / DB Admin / User Accounts / Payment Processor / Hacker)
6. Тестировщик + guards
7. Фиксер до зелёного
8. Деплоер localhost (VPS только после Клиента без P0/P1 и согласования)
9. Клиент снова; пока не «согласовано»

Если в .cursor/registry/agents.md или .cursor/skills/ появился новый агент — он в команде Оркестратора. Подключай по необходимости. **Тренера** не пропускать.
```
