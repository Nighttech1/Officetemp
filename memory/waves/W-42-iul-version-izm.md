# W-42 — версия ИУЛ из Изм.

- tickets: C-98
- status: done
- agents:
  - Client: тикет C-98 (версия = max Изм)
  - Architect: spec + chain
  - Backend: парсер титула/таблицы → `doc_version` (только цифра)
  - Frontend: `normalizeIulVersion` / `mergeIzm` → в ячейку только номер
  - Tester: pytest 8/8, selftest OK, parse dump КЖ
  - Fixer: ускорение — без `find_tables` на каждом листе
  - Deployer: localhost API 8001 перезапущен
