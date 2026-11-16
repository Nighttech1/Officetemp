# Architect — W-30 (C-69 / C-70 / C-71)

## C-69 — дерево + системная библиотека
- `docs-store`: тип `Folder { id, projectId, parentId, name, systemKey?: 'signatures' }`; у `DocItem` поле `folderId`.
- При `createProject` / `ensureDemoWorkspace` — автосоздание системной папки «Подписи».
- `ProjectSidebar`: кнопки FolderPlus / FilePlus; дерево папок+доков; ПКМ → Удалить; клик «Подписи» → `onSelectSignatures(projectId)`.
- Страница ИУЛ: режим `view=signatures` → `SignatureLibraryTable` (не компакт-панель в сайдбаре).

## C-70 — мастер
- Steps 1..4; objectName на шаге 2 «Документ»; migrate старый step 5→4, 4→3, 3→2, 2→2.
- Grid preview `minmax(420px,570px)` (~1.5×380); `items-stretch` + `h-full`.
- Top row: SlideTabs + Button «Сформировать PDF».
- `slide-tabs`: убрать hover `setPosition`; только selected.
- TabsTrigger подписанта: кнопка ✕ (stopPropagation).

## C-71 — backend
- `analyze_stamp_pdf`: для каждой страницы со score>0 собрать роли/фамилии; merge unique `(role, surname)`; meta (шифр/имя) с лучшей страницы; `source_page` = первая с ролями или список в warnings.

## Chain
Backend (C-71) → Frontend (C-69, C-70) → Тестировщик → Фиксер → Деплоер → Клиент
