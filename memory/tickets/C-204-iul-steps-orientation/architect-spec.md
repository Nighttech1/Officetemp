# Architect spec — W-75 ИУЛ UX (C-204…C-206)

## Цель

Три правки UI мастера ИУЛ без смены API/БД.

## C-204 — ориентация SlideTabs

**Корневая причина застревания в vertical:** родитель сужает оболочку табов до `w-[9.5rem]` при `stepsVertical=true`, а fit-check меряет `shell.clientWidth` этой узкой колонки → `need > have` всегда true.

**Решение:**
1. Fit-host: `data-slide-tabs-fit` на полной ширине карточки; `SlideTabs` меряет `have` по ближайшему `[data-slide-tabs-fit]`, не по узкой колонке.
2. Вёрстка vertical: кнопка «Сформировать» **над** рядом `[табы | контент шага]`, чтобы верх табов = верх заголовка «N. …» (заподлицо со строкой загрузки/шага).

Файлы: `frontend/components/ui/slide-tabs.tsx`, `frontend/components/docs/InfoSheetWizard.tsx`.

## C-205 — колонки по шаблону

Из `templates/ИУЛ template.docx` table0 gridCol dxa: `[1003, 2977, 4836, 1729]` → mm ≈ `[17.69, 52.51, 85.30, 30.50]` при сумме 186.

Обновить:
- `frontend/lib/iul-pdf.ts` → `C0`
- `frontend/components/docs/InfoSheetLivePreview.tsx` → `<colgroup>` %

Высоты строк без изменений.

## C-206 — цвет текста кнопок

- `info-sheet/page.tsx`: «Библиотека подписей» → тот же `text-ink`, что у `Button secondary` «Настройки» (лучше унифицировать через `Button variant="secondary"`).
- `DocsContourBar.tsx`: неактивный сегмент (ИУЛ/Накладные) → `text-ink` вместо `text-ink-muted`.

## Границы

- Backend / Doc Engine сервер — не трогать.
- Motion / Security — не в chain.
- Acceptance: localhost, resize narrow↔wide, превью algo-ячейка, цвет трёх кнопок.
