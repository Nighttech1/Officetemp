# W-54 architect-spec

## Цель
Закрыть C-130…C-132 на localhost без смены архитектуры Doc SaaS.

## C-130 — DnD в дереве
- Компонент: `frontend/components/ui/tree-view.tsx` + `ProjectSidebar.tsx`
- API данных: уже есть `moveDocument(docId, folderId)` в `docs-store.ts`
- Поведение:
  - `draggable` на узлах `type===doc`
  - drag payload: JSON `{ kind:'docs', ids: string[] }` — если текущий id в multi-select → все выделенные doc-id, иначе только текущий
  - drop target: узел `type===folder` (и корень проекта? только папки)
  - на drop: для каждого id вызвать `moveDocument`; обновить UI через существующий `bump`/reload
  - визуал: `opacity` при drag, `ring` на папке при dragOver
- Не трогать: cloud sync контракт (после move — как при обычном updateDocument)

## C-131 — UX накладная / SlideTabs / подписанты
1. `WaybillWizard.tsx`: удалить блок `<h1>{doc.title}</h1>` + subtitle версии; статус шаблона/данных оставить компактно **внутри** карточки или как у ИУЛ (ИУЛ не имеет внешнего h1 — ориентир).
2. Layout сетки/карточки накладной выровнять с `InfoSheetWizard` (SlideTabs + кнопки в первой строке GlassCard, без отдельного заголовка страницы).
3. `SlideTabs`: 
   - увеличить верхний отступ контейнера (`pt-2`/`mt-2` у обёртки в обоих визардах) чтобы бар не резал верх карточки
   - hover-режим: `onMouseMove` по `role=tablist` — если pointer внутри бара, вычислить индекс вкладки по `clientX` относительно кнопок и вызвать `onSelect` (throttle ~50ms); вне бара — no-op; клик/клавиатура сохранить для a11y
4. Подписанты (`InfoSheetWizard` шаг 3): убрать прыжок — все `TabsContent` оставить в `absolute inset-0` (и active тоже), родителю фиксированная `min-h` + `relative`; не переключать `relative/absolute` между active/inactive.

## C-132 — Sheet + авто-нумерация
1. `autoMapTagsToColumns`: aliases  
   - `code` / `code number` / `шифрраздела` → колонка code number / шифр  
   - `section name` / `наименованиекомплекта` → section name  
   - теги нумерации: `n`, `пп`, `п_п`, `number`, `num`, `row`, `index` → спец-источник `__seq__`
2. `buildWizardContext`: если mapping[tag] === `__seq__` → в `items`/`list` класть `String(i+1)`; также добавить виртуальную колонку в UI стыковки «№ п/п (авто)»
3. Обновить `templates/invoice template.docx`: ячейка №п/п = `{{n}}` (вместо голой «1»)
4. `WaybillTemplateHelp`: абзац про авто-нумерацию `{{n}}` / `{{п_п}}`
5. Прогон: Google Sheets URL → лист с «рд»+«финанс» → rowFrom=31,rowTo=39 → generate DOCX → артефакт в `memory/waves/W-54-.../`

## Вне scope
- VPS/prod
- Security/Hacker
- Переписывание TreeView на другую библиотеку

## Риски
- Hover-switch слишком чувствителен → порог по центру кнопки / rAF throttle
- Теги с пробелом `section name` в docxtpl — уже в шаблоне; маппинг должен сохранять ключ как есть
