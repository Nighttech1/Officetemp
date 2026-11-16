# Architect spec — W-47

## Цель
Иерархия сайдбара на TreeView (framer-motion), фикс даты подписания в форме, единый проект с папками ИУЛ/Накладные и поток «выбранные ИУЛ → накладная».

## Границы
- Frontend: `components/ui/tree-view.tsx`, `ProjectSidebar`, `InfoSheetWizard`, pages info-sheet/waybills, `docs-store`.
- Без Security/Hacker. Без VPS.
- Backend не обязателен (локальный store); Doc Engine уже умеет generateDocx/Pdf.

## C-106 TreeView
- Путь компонентов: `frontend/components/ui/` (shadcn-style). `cn` из `@/lib/utils`.
- Зависимости: `lucide-react` (есть), `framer-motion` (установить явно).
- Заменить использование `file-tree` в `ProjectSidebar` на `TreeView`.
- Props: `data: TreeNode[]`, `multiSelect`, `selectedIds`, `onSelectionChange`, `defaultExpandedIds`, `onNodeClick`.
- Подсветка: selected → `bg-accent/80`; текущая папка в selectedIds.
- Multi: ctrl/meta toggle; shift-range сохранить через обработчик в sidebar (как сейчас).
- DnD / toolbar / confirm / inline rename — сохранить.

## C-107 Дата подписания
- Причина: `applyFileModifiedDateToSignatures` пишет `дд.мм.гггг`, а `<input type="date">` ждёт `YYYY-MM-DD`.
- Решение:
  - `toHtmlDateValue(raw)` → `YYYY-MM-DD`.
  - `applyFileModifiedDateToSignatures` хранит ISO date (YYYY-MM-DD).
  - В Field value={toHtmlDateValue(s.signedAt)}; onChange пишет ISO.
  - Превью/PDF по-прежнему через `formatIulDisplayDate`.

## C-108 Структура + rename + накладная из ИУЛ
### Store
- Системные папки проекта: `iul` («ИУЛ»), `waybills` («Накладные»), `signatures` («Подписи»).
- Миграция в `loadStore` / `ensureProjectStructure(projectId)`.
- `listProjectsUnified()` / `ensureDemoWorkspace` создаёт **один** демо-проект (kind остаётся `info_sheet` как «хост», либо оба раздела читают одни и те же проекты через `listAllProjects` + ensure folders).
- Документы `info_sheet` живут в папке `iul` (или подпапках); `waybill` — в `waybills`.
- При создании документа класть в соответствующую system-папку по kind.

### Rename
- При изменении `ulCode` или `docDesignation`: `title = (ulCode || docDesignation).slice(0,200)` если непусто.
- Триггер в `persist` InfoSheetWizard и seed.

### «Сформировать накладную»
- На странице ИУЛ при `multiDocIds.length >= 1` (все info_sheet): кнопка сверху.
- Алгоритм:
  1. Взять шаблон: из последнего waybill проекта с сохранённым template blob, иначе предложить upload шаблона DOCX.
  2. Создать doc kind=waybill в папке Накладные.
  3. `rows` = по одной строке на ИУЛ: колонки из полей ИУЛ (обозначение, наименование, объект, ulCode, хэш, файл, даты…).
  4. Mapping: автостыковка по похожим именам тегов шаблона.
  5. Открыть мастер накладной / раздел накладные с этим docId.
  6. Генерация — существующий WaybillWizard generateDocx/Pdf.

## Risks
- Dual-write workspace-sync: структура folders должна сериализоваться как есть.
- Не удалять данные store.

## Acceptance
См. wave.md; Клиент обязан скачать файл.
