# Architect spec — W-41 (C-95…C-97)

## C-95
- `iulSignDateFromFileModified(fileModifiedAt)` → ДД-ММ-ГГГГ
- После штампа / seed / смены `fileModifiedAt` — все `signatures[].signedAt` = эта дата
- Превью и PDF уже через `formatIulDisplayDate`

## C-96
- Visible DFS-порядок документов в проекте
- `anchorDocId` + `multiSelectedDocIds`
- click = один; Shift+click = range
- Delete file → все выбранные (с confirm)

## C-97
- `ConfirmDialog` (glass dark)
- `renameFolder` в docs-store; `updateDocument({ title })` для документов
- double-click → inline input

## chain
1. Frontend: iul-hash, InfoSheetWizard, iul-seed, docs-store, ConfirmDialog, ProjectSidebar, file-tree (onDoubleClick)
2. Tester → Fixer → Deployer → Client
