# Chain W-31 — C-72 / C-73 / C-74

1. **Архитектор** — spec (этот тикет) — done
2. **Frontend** — file-tree UI, ProjectSidebar toolbar+DnD, docs-store move*, InfoSheetWizard batch tabs, SlideTabs fix, page wiring
   - Paths:
     - `frontend/components/ui/file-tree.tsx` (new)
     - `frontend/components/ui/slide-tabs.tsx`
     - `frontend/components/docs/ProjectSidebar.tsx`
     - `frontend/components/docs/InfoSheetWizard.tsx`
     - `frontend/app/app/documents/info-sheet/page.tsx`
     - `frontend/lib/docs-store.ts`
     - `frontend/package.json` (+ `@radix-ui/react-accordion`)
3. **Тестировщик** — guards + localhost smoke
4. **Фиксер** — до зелёного
5. **Деплоер** — localhost next/API
6. **Клиент** — приёмка

Не звать: Backend, Motion, Security, Hacker, Payment, Personal-Data.
