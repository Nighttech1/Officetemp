# W-55 architect-spec

## C-133
- `handleAddFolder`: без `prompt`; имя `"папка"`; parent = `targetFolderForCreate()`; **не** вызывать `onSelectFolder(f.id)` — оставить выделение на родителе; expand родителя + новую папку.
- `handleAddDoc`: parent из `targetFolderForCreate()` (уже так); не менять selectedFolder на новую папку если создаём внутри folder — оставить parent selected? User said folder/file create inside selected — after file create selecting the file is OK. Only folder was wrong due to selecting new folder.
- Destructure `onLibraryChange` in props OR remove the call / use optional via props ref.

## C-134
- `PreferencesCard`: chevron рядом с текстом — уже в одном flex с gap-2; возможно `flex-1` на title push chevron right. Fix: не давать title `flex-1` на всю ширину, или `w-fit` на row content.
- `WaybillTemplateHelp`: вынести в шапку карточки рядом с SlideTabs (все шаги); добавить абзац про имена полей = колонки ИУЛ (`обозначение`, `наименование`, …).
- Сообщения шага 3/4: если `w.templateName` — не показывать «Сначала загрузите шаблон».
- Preview: установить `docx-preview`, в `WaybillLivePreview` грузить blob через `loadDocTemplate(docId)`, рендерить в контейнер; при появлении mapping/rows — опционально overlay значений ИЛИ regenerация через API generate с текущим context и показ результата. MVP: docx-preview исходного шаблона + подпись «заполненные поля» из context поверх/ниже. Лучше: при наличии template — generateDocx preview (лёгкий) и docx-preview результата.

## C-135
- На `TabsList` подписантов: `onMouseMove` → индекс по Y относительно trigger → `setActiveSig`; leave сбрасывает hover tracking.

## Paths
ProjectSidebar, preferences-card, WaybillWizard, WaybillTemplateHelp, WaybillLivePreview, InfoSheetWizard; package.json (+docx-preview)
