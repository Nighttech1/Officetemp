# W-77 — Fix wizard bottom clip (P0) + client Playwright gate

| ID | P | Суть |
|----|---|------|
| C-210 | P0 | Убрать обрезку основного поля мастера снизу |

Chain: Frontend → Tester (Playwright bounds) → Fixer → Deployer → Client (Playwright scenario)
Правила Клиента обновлены: Playwright + сценарии на каждом шаге; не отдавать пользователю при открытых P0/P1.
