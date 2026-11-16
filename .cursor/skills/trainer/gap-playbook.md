# Gap playbook — типовые пробелы → куда писать знание

| Симптом от пользователя | Вероятный пробел | Куда дополнить |
|-------------------------|------------------|----------------|
| «Не то выравнивание / плашки не там» | нет layout-чеклиста кабинета | `frontend` skill + `client-review` REJECT |
| «Полоска прокрутки / обрезано» | нет overflow/height guard | `frontend` + `tester` guards + Playwright probe |
| «Кнопки не там / путь убрать» | нет chrome-layout контракта | `DocsContourBar` notes в frontend skill / ticket template |
| «Не то имя кнопки» | нет copy-контракта в тикете | `ticket-engine` + Client acceptance copy check |
| «На мобиле едет» | не звали mobile Playwright | `client.mdc` + `responsive-mobile-web` / `a11y-mobile-qa` |
| «Лендинг пустой / не premium» | нет landing-client-ready | `landing-promo` + Client presence checklist |
| «Сломали данные / БД» | нет data-safety в chain | уже `data-safety-*.mdc` — усилить deployer/backend skill |
| «Оплата / касса» | нет Payment Processor в chain | registry + `payment-processor` |
| «Пентест / дыры» | звали Security вне цикла | `SECOND_SECURITY_CYCLE.md` |
| «MCP не видит страницу» | нет/сломан playwright MCP | `.cursor/mcp.json` + `plugins/trainer` |
| «Команда снова мимо правок» | не вызвали Тренера / нет gap | `orchestrator.mdc` шаг 0 + `trainer-grade.md` |
| «Нет роли под задачу» | роль не в реестре | чеклист `team-org.mdc` + регистрация агента |

После каждого реального кейса добавляй строку сюда — это живая память Тренера.
