# Guards W-53

## C-127 — Times New Roman + bold
- [x] `npx tsx lib/iul-pdf.selftest.ts` → OK, PDF содержит TimesNewRoman
- [x] Артефакт: `memory/tickets/C-127-iul-pdf-times-bold/sample-iul-times.pdf` (~239 KB)
- [x] В коде: `IUL_PDF_FONT = "TimesNewRoman"`, `IUL_PDF_FONT_SIZE = 10`
- [x] Bold только заголовки/MD5; «Наименование объекта» и «Лист»/«Листов» — regular (как Word)

## C-128 — chevron + tooltip
- [x] `preferences-card.tsx`: ChevronRight сразу после title/hint, не у правого края
- [x] `HelpHoverPopover`: `createPortal` → `document.body`, `fixed` + `z-[200]`

## C-129 — min 14px
- [x] Tailwind `xs`/`sm` = 14px
- [x] globals: `text-[8px]`…`text-[13px]` → 14px !important
- [x] `.iul-sheet-preview` исключение: Times 10pt

## Regression
- Геометрия колонок C0/C1/C2 не менялась
