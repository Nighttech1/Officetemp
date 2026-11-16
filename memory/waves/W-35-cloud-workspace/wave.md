# Wave W-35 — Cloud workspace dual-write

- **Тикеты:** C-80, C-81, C-82 (лимит 3)
- **Статус:** backend+FE dual-write каркас готов на localhost; VPS — стоп
- **Тесты:** `pytest tests/test_workspace.py tests/test_auth.py` — 6 passed
- **Spec:** `memory/tickets/C-80-cloud-workspace-sync/architect-spec.md`
- **Chain:** `memory/tickets/C-80-cloud-workspace-sync/chain.md`
- **Осталось:** live приёмка двух браузеров; S3 upload картинок подписей (не только preview); удаление аккаунта; VPS после «да»
