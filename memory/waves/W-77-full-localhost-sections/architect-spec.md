# W-77 — Full localhost all sections

## Диагноз Клиента
- Стек в целом жив (/, API :8005), но кабинетные разделы сыпят runtime:
  - `SlideTabs` → setState during render (WaybillWizard)
  - workspace snapshot PUT 422
  - HMR full reload due to runtime error
- Сообщения AuthGate/api всё ещё про :8001 при реальном :8005

## План
1. Фиксер: SlideTabs (не setState в render)
2. Фиксер: api/AuthGate порт 8005 в fallback/текстах
3. Деплоер: чистый рестарт FE+BE+Postgres+Redis
4. Тестировщик: smoke `/`, `#about`, waybills, info-sheet, login, contact
