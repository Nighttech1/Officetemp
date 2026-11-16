# Architect — W-31 (C-72 / C-73 / C-74)

## Цель
Сайдбар ИУЛ → Magic UI File Tree + компактный тулбар; DnD файлов; пакетные ИУЛы с вертикальными табами по PDF; надёжные SlideTabs шагов.

## Границы
- Только Frontend (+ клиентская генерация PDF через существующий `iul-pdf` / `analyzeIulPdf`). Backend API не меняем.
- Системная папка «Подписи» без изменений (не DnD внутрь, не удаляется).
- VPS не трогаем.

## C-72 — дерево + тулбар + DnD
1. Порт Magic UI `file-tree` в `components/ui/file-tree.tsx` (визуал + Accordion; без ScrollArea/Button shadcn — native scroll).
2. Зависимость: `@radix-ui/react-accordion`.
3. `ProjectSidebar`: данные → `TreeViewElement[]` (проекты как корни-папки, docs как files, «Подписи» отдельно).
4. Тулбар: ряд icon-кнопок `h-7 w-7` / иконки `h-3.5`:
   - +папка, +файл, удалить папку, удалить файл, batch (3 docs + +).
5. `docs-store`: `moveDocument(docId, folderId)`, `moveFolder(folderId, parentId)` с проверками циклов и systemKey.
6. HTML5 DnD: file → folder / project root; визуальный drop-target.

## C-73 — batch ИУЛ
1. Тулбар «несколько документов» → `<input multiple accept=.pdf>`.
2. На каждый PDF: `createDocument` в `targetFolder`, title = имя файла; `applyFile` (хэш + analyze stamp) как в одиночном мастере.
3. Страница держит `batchDocIds: string[]`; мастер получает `batchDocIds` + `activeDocId`.
4. На шагах 1–4: вертикальные `Tabs` слева (имена PDF); контент = wizard активного doc.
5. Генерация: цикл по batch → `buildIulPdfBlob` → скачать каждый; кнопка **«Скачать ИУЛы»**.
6. Выход из batch: выбор одиночного doc в дереве сбрасывает batch (или batch = один doc).

## C-74 — SlideTabs
1. `pointer-events-none` на motion-индикаторе.
2. Клик через `<button type="button">` внутри tab (не только `li`).
3. ResizeObserver + remeasure после fonts/layout; `layoutId` не обязателен.
4. Убрать `mix-blend-difference` с hit-target (оставить контраст через классы selected).

## Acceptance (Клиент)
- Дерево визуально как Magic UI; тулбар мелкий.
- DnD файла в другую папку → файл там после drop.
- Batch: 2+ PDF → 2+ ИУЛ в папке; табы на каждом шаге; «Скачать ИУЛы» качает все.
- Клик по шагам 1↔2↔3↔4 стабильно с первого раза.

## Chain
`memory/tickets/C-72-magic-file-tree-toolbar/chain.md`
