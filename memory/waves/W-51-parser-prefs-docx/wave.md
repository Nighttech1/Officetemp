# Волна W-51

| Тикет | Приоритет | Статус |
|-------|-----------|--------|
| C-121 | P0 | done |
| C-122 | P1 | done |
| C-123 | P1 | done |

## Кто что сделал
- **Архитектор:** spec + chain (Backend → FE → Tester → Fixer → Deployer → Client)
- **Бекендер:** `iul_stamp` — приоритет титула, `_weak_filename_doc_name`, нормализация «…»
- **Фронтендер:** `preferences-card.tsx` + шаг Данные; «Сформировать DOCX» рядом с PDF
- **Тестировщик:** pytest 11/11; Playwright localhost
- **Фиксер:** hooks до early return; deps selectedIulDocs
- **Деплоер:** localhost FE:3000 / API:8001 (--reload)
- **Клиент:** приёмка ниже
