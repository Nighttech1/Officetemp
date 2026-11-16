# Guards — C-61 / C-62 / C-63 (W-26 ИУЛ)

## C-61 Мастер шагов
- [x] `/app/documents/info-sheet` показывает шаги: Файл → Шапка → Документ → Подписи → PDF (не шаги накладной)
- [x] Справа live-preview табличного ИУЛ
- [x] Скрин: `visual/after-desktop-1440.png`

## C-62 Автозаполнение с PDF
- [x] Загрузка `sample-signed.pdf` → имя `sample-signed.pdf`, размер `3188`, SHA-256 64 hex
- [x] Хэш считается в браузере (нет POST файла на API)
- [x] Поля редактируемы после автозаполнения
- [x] Образец: `memory/tickets/C-62-iul-pdf-autofill/sample-signed.pdf`

## C-63 Скачивание PDF
- [x] «Сформировать PDF» → файл `sample-signed_УЛ_2026-09-24.pdf`
- [x] Артефакт: `artifacts/iul-download.pdf`, размер **8914** байт (> 0)
- [x] Статус документа → «готов»; note «Скачан … (8914 байт)»
- [x] Сравнение с эталоном gostcheck: есть шапка объекта, таблица документа, блок файла+хэш, подписи, колонтитул УЛ

## Regression
- Накладные (`/app/documents/waybills`) не затронуты (отдельный WaybillWizard)
