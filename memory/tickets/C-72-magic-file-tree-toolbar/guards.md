# Guards W-31 — C-72 / C-73 / C-74

## C-72 Magic UI tree + toolbar + DnD
- [x] Сайдбар: мелкие icon-кнопки (папка+, файл+, удалить папку, удалить файл, batch 3docs+)
- [x] Дерево: Magic UI `Tree`/`Folder`/`File` (accordion + индикатор)
- [x] `moveDocument` в docs-store; DnD file → folder/project root
- [x] Клик по проекту не сбрасывает открытый документ
- Snap: `snap-after.png`, `snap-tree-expanded.png`

## C-73 Batch IUL
- [x] Кнопка «Создать несколько документов» → multi PDF input
- [x] `seedIulFromPdf` + createDocument в текущую папку
- [x] Вертикальные табы по имени PDF на шагах 1–4
- [x] Кнопка «Скачать ИУЛы» в batch (вместо «Сформировать PDF»)
- Ручная проверка: загрузить ≥2 PDF через тулбар

## C-74 SlideTabs
- [x] Клики через `<button role="tab">`, индикатор `pointer-events-none`
- [x] **Корень бага:** `normalizeIulStep` мапил 3→2 и 4→3 (миграция старой 5-шаговой схемы на каждый клик). Исправлено: 1–4 identity, только 5→4.
- [x] Файл → Документ → Подписи → PDF с первого клика
- Snap: `../C-74-slide-tabs-click/snap-after-doc-tab.png`, `snap-step4-fixed.png`

## Regression
- Системная «Подписи» на месте
- Localhost: http://127.0.0.1:3000/app/documents/info-sheet
- API: :8001 (proxy Next)
