# Architect — W-46 C-103/104/105

## C-103
- InfoSheetWizard step1: `onDragOver` preventDefault + `onDrop` → applyFile
- `IUL_MAX_PDF_BYTES = 100 * 1024 * 1024`; проверка до хэша; ConfirmDialog
- next.config 100mb; backend MAX_PDF_BYTES 100mb

## C-104
- Folder `isSelect` = `selectedFolderId === f.id` (не сбрасывать при выборе файла)
- Ярче фон/кольцо активной папки

## C-105
- В `applyProjectRoleSettings`: для роли ≠ Разработал — одна запись (первая); Разработал — все

## chain
1. Frontend (wizard drop+limit, sidebar, docs-store)
2. Backend MAX_PDF + next.config
3. Tester → Fixer → Deployer → Client
