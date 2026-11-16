# chain.md — W-35 Cloud workspace + 152-ФЗ

Порядок строго последовательный (overlapping paths не параллелить):

1. **Architect** — spec (этот тикет) ✅
2. **Personal-Data DB** — классификация ПДн, consent_at, политика удаления; что НЕ класть в public JSONB
3. **Backend** (+ safe-db-migrations) — Alembic: workspace_* + signatures meta; API snapshot/migrate; org isolation tests
4. **Frontend** — dual-write adapter над docs-store + signature-library; импорт LS; чекбокс согласия на register
5. **Documentation** — Политика конфиденциальности (простой язык) + краткий 152-ФЗ чеклист в docs/
6. **Tester** — API isolation + sync roundtrip + FE unit; e2e два «профиля» через API
7. **Fixer** — до зелёного
8. **Deployer** — **только localhost** (compose postgres). VPS — стоп до вердикта Клиента
9. **Client** — приёмка сценариев A–E из architect-spec

Не звать: Motion, Landing Promo, AI Bridge, Security/Hacker (второй цикл — отдельной командой).
