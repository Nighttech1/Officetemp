# Guards W-47

## C-106 TreeView
- [x] `components/ui/tree-view.tsx` существует; framer-motion import
- [x] ProjectSidebar использует TreeView (не Accordion file-tree)
- [x] multiSelect + ctrl + shift
- [x] Подсветка selected: data-selected + cyan ring
- [x] Screenshot: `screens/sidebar-tree.png`

## C-107 Дата подписания
- [x] Selftest: `toHtmlDateValue("23.09.2026") === "2026-09-23"`
- [x] Live: поле type=date = `2026-09-23`, превью = `23.09.2026`
- [x] applyFileModifiedDateToSignatures пишет ISO

## C-108 Структура + rename + накладная
- [x] Папки ИУЛ / Накладные / Подписи в проекте
- [x] После генерации имя в дереве = шифр УЛ (`56-0321-ОК-1-2-КЖ6.2_УЛ`)
- [x] Кнопка «Сформировать накладную» при выборе ИУЛ
- [x] Скачан ИУЛ PDF: `artifacts/56-0321-…_УЛ_….pdf` (~302 KB)
- [x] Скачана накладная DOCX: `artifacts/Накладная1-…-filled.docx` (~200 KB)
- [x] Скачана накладная PDF: `artifacts/Накладная1-…-filled.pdf` (~187 KB)
- [x] Screenshot waybills: `screens/waybills-structure.png`
