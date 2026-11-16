# Architect — W-27 (C-64 / C-65 / C-66)

## Цель

После загрузки PDF в ИУЛ: разобрать **основной штамп чертежа** (ГОСТ, правый нижний угол листа с Разработал/Проверил/…) и заполнить поля ИУЛ; плюс библиотека картинок подписей с автоподстановкой по фамилии.

## Эталонный разбор (`templates/…КЖ3…Паркинг.pdf`)

Со страницы со штампом (не титул):
- **Обозначение:** `56-0321-ОК-1-КЖ3.3`
- **Объект:** «Жилой дом с инженерными сетями…» + адрес
- **Наименование листа/документа:** `Общие данные` (fallback — хвост имени файла)
- **Подписи:**
  - Разработал → Зеленцов
  - Проверил → Пустовалов
  - Н. контр. → Пустовалов
  - ГИП → Шевченко
  - даты `11.09.26` → `2026-09-11`

## API

`POST /api/v1/iul/analyze-pdf` (JWT как остальные upload)
- body: `file: UploadFile` (PDF, max ~50MB)
- response:
```json
{
  "object_name": "...",
  "doc_designation": "...",
  "doc_name": "...",
  "doc_version": "0" | "Изм.1" | "",
  "ul_code": "<designation>_УЛ",
  "signatures": [
    {"role": "Разработал", "surname": "Зеленцов", "signed_at": "2026-09-11"}
  ],
  "source_page": 2,
  "warnings": []
}
```
Файл на диск не сохраняем (только in-memory parse). Зависимость: `pymupdf`.

## Парсер (`app/services/iul_stamp.py`)

1. Открыть PDF (pymupdf).
2. Найти страницу-штамп: есть слова `Разработал`/`Проверил`/`ГИП` и шифр вида `\d{2}-\d{4}-…`.
3. Собрать words с bbox; сопоставить роли с ближайшей фамилией справа в той же строке.
4. Объект — блок текста между шифром и «Общие данные»/названием листа или многострочный блок слева от стадии.
5. Версия — из имени файла `(Изм.N)` или ячейки Изм.
6. Fallback из filename: `шифр` + название после скобок.

## Frontend

1. После выбора PDF: hash локально **и** `analyzeIulPdf(file)` → persist в `iulWizard` (objectName, doc*, signatures, ulCode).
2. `InfoSheetSignature` + `signatureImageDataUrl?: string`.
3. Библиотека: `frontend/lib/signature-library.ts` + UI `SignatureLibraryPanel` на шаге 4.
   - meta localStorage `docsaas_sign_lib_v1`
   - images IndexedDB
4. При появлении/смене фамилии — `matchSignature(surname)` → заполнить `signatureImageDataUrl`.
5. Preview + `iul-pdf.ts`: рисовать image в ячейке «Подпись».

## Chain

1. Backend — analyze-pdf + pymupdf parser + test на эталоне
2. Frontend — API client, wizard autofill, library UI, PDF/preview images
3. Тестировщик → Фиксер → Деплоер → Клиент

## Non-goals

OCR рукописных закорючек как текста; проверка УКЭП; режим «несколько документов».
