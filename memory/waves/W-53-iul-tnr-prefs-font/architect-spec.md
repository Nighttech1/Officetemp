# W-53 architect-spec

## Цель
Согласовать PDF ИУЛ с Word (`Times New Roman` 10pt + bold только у заголовков шаблона) и поправить UX шага «Данные» + читаемость UI.

## C-127
- Встроить `times.ttf` + `timesbd.ttf` в `frontend/public/fonts/` (копия с Windows Fonts для локального соответствия Word).
- `IUL_PDF_FONT = "TimesNewRoman"`; register normal/bold.
- Кегль ячеек PDF: **10** (не 7–8), bold строго по Word:
  - bold: заголовки doc/file/sig, MD5
  - regular: «Наименование объекта», значения, футер (в т.ч. «Лист»/«Листов»)
- Live preview: `font-family: Times New Roman` + те же bold-правила; класс `.iul-sheet-preview` для исключения из floor 14px.
- Selftest: проверять в PDF строку TimesNewRoman / Times.

## C-128
- `PreferencesCard`: ChevronRight сразу после блока title+hint (inline), не `ml-auto` у края.
- `HelpHoverPopover`: `createPortal(..., document.body)` + `position:fixed` по rect триггера; z-index ≥ 100, чтобы не клипался `overflow-hidden` карточки.

## C-129
- Tailwind: `xs`/`sm` ≥ 14px; globals: floor 14px для UI-классов `text-[10px]`…`text-[13px]` → 14px !important; сохранить cap 16px.
- Не трогать `.iul-sheet-preview` (факсимиле 10pt).

## Вне scope
Backend API, VPS, Security.
