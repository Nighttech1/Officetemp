# W-54 chain.md

1. **Архитектор** — spec ✓ (`architect-spec.md`)
2. **Frontend** — C-130 (TreeView DnD + ProjectSidebar), C-131 (WaybillWizard layout, SlideTabs hover/offset, InfoSheetWizard sigs), C-132 FE (autoMap + buildWizardContext + WaybillTemplateHelp + правка invoice template.docx)
3. **Google Sheets** (в рамках FE/API) — прогон подключения листа + диапазон 31–39 (без новых роутов, существующий `/data/google`)
4. **Doc Engine** — только проверка рендера DOCX на артефакте прогона (код движка не менять, если `__seq__` закрыт на FE context)
5. **Тестировщик** — guards.md + скрипт/API прогон генерации
6. **Фиксер** — до зелёного
7. **Деплоер** — localhost FE+API
8. **Клиент** — приёмка (скачивание DOCX обязательно для C-132)

Overlapping paths: не параллелить правки `WaybillWizard.tsx` / `SlideTabs` / `docs-store.ts`.
