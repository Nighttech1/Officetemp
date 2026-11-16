# Guards C-68 — ИУЛ UX tabs / library / object=project

## Класс дефекта
Регресс UX мастера ИУЛ: объект из PDF, библиотека на шаге 4, PDF-режим подписей, вертикальный список подписантов без вкладок, pill-шаги вместо SlideTabs.

## Исполняемые проверки

### G1 — objectName = имя проекта
1. Открыть `/app/documents/info-sheet`, выбрать проект.
2. Шаг «Шапка»: поле «Наименование объекта» = название проекта, `readOnly`.
3. После загрузки PDF поле **не** перезаписывается `object_name` из штампа.

### G2 — библиотека только в сайдбаре
1. В сайдбаре под проектом есть пункт «Подписи».
2. На шаге 4 мастера **нет** блока «Библиотека подписей» и **нет** переключателя «Из PDF».

### G3 — вертикальные Tabs подписантов
1. Шаг 4: слева список фамилий (TabsTrigger), справа поля активного подписанта.
2. Картинка подписи только через `findSignatureImage(projectId, surname)`.

### G4 — SlideTabs
1. ИУЛ и накладная: шаги через `SlideTabs` (не ряд pill-кнопок).

### Автопроверка (статическая)
```
rg -n "Из PDF|signatureSource === \"pdf\"|SignatureLibraryPanel" frontend/components/docs/InfoSheetWizard.tsx
# ожидается: нет «Из PDF», нет SignatureLibraryPanel на шаге 4
rg -n "SlideTabs" frontend/components/docs/{InfoSheetWizard,WaybillWizard}.tsx
rg -n "Подписи" frontend/components/docs/ProjectSidebar.tsx
```

## Артефакт приёмки
Скрин localhost шаг 4 + сайдбар с «Подписи»; запись в regression-guards.md.
