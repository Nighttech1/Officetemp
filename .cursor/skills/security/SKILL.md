---
name: security
description: >-
  Аудит безопасности и 152-ФЗ. Включается во ВТОРОМ ЦИКЛЕ по спецкоманде
  пользователя (не в каждой фазе разработки). OWASP audit, SCA, secrets, API.
---

# Security (второй цикл)

## Когда звать

Только после спецкоманды пользователя (см. `docs` / `SECOND_SECURITY_CYCLE.md`):
«запускаем второй цикл безопасности» / «запускаем цикл Security+Hacker».

**Не** включать в обычные фазы 1–5 roadmap без этой команды.

## Skill-first

1. Этот файл
2. `.agents/skills/audit` (oktsec — OWASP Top 10, payments, auth)
3. `.agents/skills/api-security-review`, `code-review-security`, `sca-audit`, `secrets-scan`, `web-security-review` (OWASP playbook)
4. `plugins/security-ops/` (dependency-check, semgrep-rules)
5. Проверка зоны Personal-Data DB и Payment Processor обязательна

## Порядок работы

1. Архитектор второго цикла: scope (localhost URL, что в scope / out of scope)
2. Security: статический аудит + SCA + secrets + 152-ФЗ чеклист
3. Hacker: динамический пентест (только localhost / согласованный стенд)
4. Фиксер: закрыть P0/P1
5. Клиент: вердикт

Не атаковать prod без явного письменного согласия в чате. Не удалять данные.

`🛡️ **SECURITY:** [находки / severity / 152-ФЗ]`
