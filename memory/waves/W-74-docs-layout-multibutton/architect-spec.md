# W-74 Architect Spec

## Цель
Исправить кабинет ИУЛ/Накладные: стабильная вёрстка при resize, MultiButton для дерева, дерево у шапки, resizable preview, быстрый вход с лендинга.

## Границы
- Только Frontend (Next/React). Backend/Docker не трогаем.
- Data-safety: localStorage ключи сайдбара/preview — ок; БД не трогаем.
- Компонент MultiButton → `frontend/components/ui/multi-button.tsx` (путь проекта, не /components/ui от корня репо).

## C-202 Layout + chrome
1. `slide-tabs.tsx`: одна строка + `overflow-x-auto`, без wrap; cursor после resize.
2. Wizard grid: убрать жёсткий `minmax(420px,570px)` → гибкий `minmax(min(100%,280px), min(42vw,520px))` или CSS vars от resize.
3. `ProjectSidebar`: удалить блок «DocSaaS · … / Проект → … / Home»; тулбар+поиск+дерево сразу под верхом aside.
4. Home оставить в `DocsContourBar` / глобальном nav (уже есть).

## C-203 MultiButton
1. Добавить `multi-button.tsx` как в ТЗ (framer-motion + lucide уже есть).
2. В `ProjectSidebar` заменить tool buttons на `MultiButton` (или Compact с restIcon EllipsisVertical).
3. Items: add-folder, add-doc, del-folder, del-doc; ИУЛ + batch.
4. Стилизовать под тёмный сайдбар (`variant="outline"|"ghost"`, highlight brand/cyan).

## C-204 Preview resize + nav
1. Общий хук/обёртка `ResizablePreviewShell`: drag ширины колонки + высоты панели; persist `docsaas_preview_w` / `docsaas_preview_h`.
2. Подключить в `WaybillWizard` + `InfoSheetWizard` / LivePreview.
3. `AuthGate`: показывать children сразу, auth в фоне (баннер при необходимости) — убрать блок «Подключаем кабинет…» на 3.5–4с.
4. Prefetch `/app/documents/waybills` и `info-sheet` с MegaNav; `dynamic` для тяжёлых wizard/preview где уместно.
5. `loading.tsx` скелетон под documents (опционально).

## Acceptance (язык Клиента)
- Узкий и широкий экран: вкладки и форма не разъезжаются.
- Над деревом нет «DocSaaS · Накладные».
- Кнопки дерева — одна MultiButton с анимацией подписей.
- Предпросмотр тянется за край по ширине и высоте.
- Клик с лендинга → кабинет без долгой паузы «Подключаем…».
