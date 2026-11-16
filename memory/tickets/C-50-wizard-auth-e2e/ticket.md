# C-50 — Авто-сессия + гидрация + проход мастера

**Priority:** P0  
**Wave:** W-20  
**Status:** done

## Проблемы со скринов
1. `Not authenticated` — upload шаблона/Excel падает
2. Hydration mismatch ProjectSidebar (SSR пусто / client localStorage)
3. Шаги «ломаются», шаблон «не загружен»

## Acceptance
- [ ] Без ручного входа analyze/excel/generate работают (dev auto-session)
- [ ] Нет hydration error на /app/documents/waybills
- [ ] Клиент-агент прогнал сценарий шагов 1→4
