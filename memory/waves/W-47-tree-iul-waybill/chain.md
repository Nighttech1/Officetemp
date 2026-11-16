# chain.md — W-47

1. **Архитектор** — spec (этот файл + architect-spec.md) ✓
2. **Frontend** — tree-view.tsx; ProjectSidebar на TreeView; C-107 date helpers; C-108 store folders + rename + кнопка накладной; pages
3. **Doc Engine** (лёгкий) — хелпер строк ИУЛ→waybill rows/mapping (frontend lib)
4. **Тестировщик** — unit/selftest + playwright smoke + генерация PDF/DOCX
5. **Фиксер** — до зелёного
6. **Деплоер** — localhost FE+API
7. **Клиент** — приёмка до скачанного файла

Overlapping paths (не параллелить):
- `frontend/components/docs/ProjectSidebar.tsx`
- `frontend/lib/docs-store.ts`
- `frontend/components/docs/InfoSheetWizard.tsx`
- `frontend/app/app/documents/**`
