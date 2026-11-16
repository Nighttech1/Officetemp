# Architect — W-44 C-100

## Scope
Только `frontend/lib/iul-pdf.ts` + форматтеры дат `iul-hash.ts` (превью/PDF/форма используют их).

## План
1. **Подписи:** `getImageProperties` → вписать в ячейку с сохранением aspect ratio; центрировать; высоту строки от фактического размера картинки (не фикс. stretch на всю ширину×высоту).
2. **Центр:** `doc.text(..., { align: "center" })` + x = середина ячейки; hash-ячейка тоже.
3. **Убрать** блок `Продолжение УЛ к документу …` (ulCode в футере оставить).
4. **Даты:** `formatIulDisplayDate` / `formatFileModifiedDisplay` / `formatFileModifiedAt` → `DD.MM.YYYY`; обновить selftest.

## chain
Frontend → Tester → Fixer → Deployer → Client
