# Architect spec — W-48

## C-109 TreeView
- `showLines={false}` (или удалить блок линий).
- Row highlight: `inline-flex` / `w-fit max-w-full` на motion.div строки, не full-bleed.
- Expand bug: убрать `useEffect`, который при `selectedFolderId` принудительно добавляет `fld:` в expanded. Expand только через toggle клика.
- Resize: в `ProjectSidebar` / page layout — `aside` width state (localStorage `docsaas_sidebar_w`), drag handle 4px справа, min 220 max 480.

## C-110
- В `buildFolderBranch` / `listFolders` UI: фильтр `systemKey !== "signatures"`.
- Не создавать новые signatures-папки в ensure (опционально оставить в store для библиотеки по кнопке — библиотека не зависит от папки в дереве).
- Убрать из defs ensureProjectSystemFolders key signatures **или** оставлять в store но не показывать.

## C-111
- `waybills/page.tsx`: при клике info_sheet — НЕ router.push; копить `selectedIulIds` через onMultiDocChange / onSelectDoc.
- `WaybillWizard`: prop `selectedIulIds?: string[]`.
- Шаг 2: ниже cloud/excel — блок «ИУЛ из дерева» со списком; кнопка «Подставить строки из выбранных ИУЛ» → rows/columns как iul-to-waybill.
- Шаг 3: mapping tags → IUL columns (уже есть autoMap); если rows из ИУЛ — показать источник.
- Генерация без изменений API.

## Chain
Frontend → Tester → Fixer → Deployer → Client
