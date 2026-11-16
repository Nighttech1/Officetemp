# W-78 Frontend Notes

Дата: 2026-10-02

## C-211 Preview no vertical scrollbar

- `ResizablePreviewShell.tsx`: `height: fit-content`; default viewport `maxHeight: calc(100dvh - 10rem)` **removed**. `maxHeight` only when user stored a height via drag. Inner wrapper: `overflow-visible` + `h-auto` (no `overflow-y-auto` / `flex-1`).
- `InfoSheetLivePreview.tsx`: aside `h-auto`; sheet host `overflow-x-auto overflow-y-visible` (no `flex-1` / `overflow-auto`).
- `WaybillLivePreview.tsx`: aside `h-auto`; frame/host prefer `h-auto` + `overflow-y-visible` (dropped `h-full flex-1 overflow-y-auto`).

## C-212 Signatures plaques + chrome

- `DocsContourBar.tsx`: breadcrumbs `<ol>` removed; required `title: string` as left heading; product pills stay right; optional `actions?: ReactNode` before pills.
- `info-sheet/page.tsx` / `waybills/page.tsx`: pass titles; Settings / Библиотека / Настройки реестра moved into `actions`; page `h1` block removed (subtitle kept).
- `InfoSheetWizard.tsx` / `WaybillWizard.tsx`: `SlideTabs` + generate row moved **above** `GlassCard`; card holds step content only.
- IUL step 3: `TabsList` `flex-row flex-wrap items-start justify-start`; «+ Добавить» first plaque in the row; form below plaques (`items-start` column).

## C-213 Waybill step 5

- Large «Сохранить настройки реестра» removed from step body.
- Bottom nav: secondary small «Сохранить настройки реестра» next to primary on step 5.
- Step 5 primary label «Записать данные в реестр»; enabled; `onClick` → `saveRegistry`.
- Steps 1–4 keep «Далее» / «К реестру (необязательно)».

## Files touched

- `frontend/components/docs/ResizablePreviewShell.tsx`
- `frontend/components/docs/InfoSheetLivePreview.tsx`
- `frontend/components/docs/WaybillLivePreview.tsx`
- `frontend/components/docs/DocsContourBar.tsx`
- `frontend/app/app/documents/info-sheet/page.tsx`
- `frontend/app/app/documents/waybills/page.tsx`
- `frontend/components/docs/InfoSheetWizard.tsx`
- `frontend/components/docs/WaybillWizard.tsx`
- `memory/waves/W-78-preview-chrome-registry/frontend-notes.md`

Backend / DB / VPS: not touched.
