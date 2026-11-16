# W-76 Architect Spec

## C-207 MultiButton fillWidth
- Props: `fillWidth`, `restDistribute` на `MultiButton`
- Rest (`activeId=null`): ширина = 100% родителя; иконки равномерно
- Hover: текущий morph с подписью внутри той же ширины
- ProjectSidebar: `w-full`, без shrink-0/overflow-x-auto на тулбаре

## C-208 No clip
- `ResizablePreviewShell`: режим fill (`flex-1 min-h-0 h-full`), height drag = max-height preference
- Wizard row: stretch; убрать sticky конфликтующий с overflow-hidden
- Page: сохранить viewport lock; внутренний scroll только у DocsStepMotion; waybill step 5 (реестр) — overflow-y-auto разрешён
- Убрать жёсткий default 560px как единственную высоту превью

## C-209 Folder stable
- info-sheet `onSelectProject`: `setDocId(null)` только если `id !== projectId`
- Убрать `folderId` из deps ensure-draft effect (оба раздела)
- Sidebar: при клике папки того же проекта не вызывать лишний clear doc

## Boundaries
Frontend only. Data-safety OK.
