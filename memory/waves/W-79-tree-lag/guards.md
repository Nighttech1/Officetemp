# Guards W-79

## C-220 — ИУЛ как файлы с обозначением
- BEFORE: 144× папка «ИУЛ», иконка Folder, без designation
- AFTER (Playwright 2026-10-02): folders 297→9; iulNamed=0; waybillNamed=0
- Tree under АР shows `56-0321-ОК-1 (Изм. 3)` (docDesignation), not «ИУЛ»
- Artifact: `memory/waves/W-79-tree-lag/after-ar.png`

## C-221 — лаги дерева
- Root cause: flood folders + refreshKey on every persist/step
- Fix: purge + onChanged only for tree-relevant fields; no refresh on step

## C-222 — системные папки + плавность шагов
- Removed ensure/create of iul/waybills system folders
- SlideTabs hover no longer calls onSelect (click only)
- Backend preserves systemKey for known keys

## Hypotheses
- A CONFIRMED → fixed
- B REJECTED (were real folders)
- C REJECTED
- D CONFIRMED → fixed by purge
- E CONFIRMED → fixed by no hover-select + no onChanged on step
