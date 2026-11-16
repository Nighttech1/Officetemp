# Guards C-86 / C-87 / C-88 (W-37)

## Automated
- [x] `npx tsx lib/iul-hash.selftest.ts` → OK (MD5 len=32, formatIulDisplayDate, iulVersionCell)
- [x] `tsc --noEmit` → OK

## MCP localhost (2026-09-25)
- [x] Мастер сразу на экране; **Настройки** рядом с **Сформировать PDF**
- [x] Панель: «Базовый стартовый алгоритм хэширования» (MD5 по умолчанию)
- [x] Хэш MD5 длина 32: `5b6bbc8a5423a404669cb64aa1ec05f1`
- [x] Дата изменения `23-09-2026 11:42:37`; даты подписей `05-06-2026`
- [x] Скрины: `C-87-…/visual/after-header.png`, `after-settings.png`

## Regression
- Одиночная загрузка PDF и ZIP-пакет без поломки.
