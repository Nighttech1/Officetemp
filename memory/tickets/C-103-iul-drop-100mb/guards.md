# Guards C-103 / C-104 / C-105

## C-103
- Зона загрузки: drag-over подсветка; drop вызывает applyFile
- Файл >100 МБ → ConfirmDialog «Максимальный размер PDF — 100 МБ»
- next.config middlewareClientMaxBodySize=100mb; backend MAX_PDF_BYTES=100mb

## C-104
- Клик по папке → голубая подсветка остаётся при выборе файла внутри
- «Новая папка» prompt: «внутри «Имя»»; папка создаётся под selectedFolderId

## C-105
```text
npx tsx lib/iul-formation.selftest.ts
```
Проверил×2 → первая; Разработал×2 → обе; ГИП×2 → первая.
