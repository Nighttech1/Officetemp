# Architect — W-34 (C-78 / C-79)

## Store `signature-library.ts` → v3
- `SignatureFolder { id, projectId, parentId, name, createdAt }`
- `SignatureLibEntry.folderId: string | null`
- META_KEY `docsaas_sign_lib_v3` (migrate v2: entries без folderId → null, folders: [])
- API: `listSignFolders`, `createSignFolder`, `deleteSignFolder`, `moveSignature`, `listSignatureLibrary(projectId, folderId?)`

## UI SignatureLibraryTable
- Слева/сверху: дерево папок (или список + «в папку») + кнопка «Новая папка» / «Подпапка»
- Таблица показывает записи текущей папки (или все при поиске)
- Поиск: input; `filter` по surname при каждом onChange (без debounce) — строки появляются/скрываются сразу
- При активном поиске — плоский список по всему проекту (с путём папки), иначе — содержимое текущей папки

## C-79
- Над формой ФИО+кнопка заголовок `Добавить подпись` (h3)

## Chain
Frontend → Tester → Client
