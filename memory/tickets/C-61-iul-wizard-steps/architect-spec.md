# Architect — W-26 Конструктор ИУЛ (C-61 / C-62 / C-63)

## Цель

В `/app/documents/info-sheet` заменить мастер накладных на **мастер ИУЛ** по структуре [gostcheck конструктор ИУЛ](https://gostcheck.ru/tools/iul-constructor), с отличием: **шаг 1 = загрузка PDF с ЭЦП** → автозаполнение хэша и метаданных файла.

## Модель данных (local-first)

Расширить `docs-store`:

```
InfoSheetHashAlgo = "MD5" | "SHA-1" | "SHA-256" | "CRC32"

InfoSheetSignature = {
  role: string;       // характер работы
  surname: string;
  signedAt: string;   // дата YYYY-MM-DD
  note: string;       // подпись / расшифровка (опц.)
}

InfoSheetWizardState = {
  step: 1 | 2 | 3 | 4 | 5;
  // шаг 1 — файл
  sourceFileName: string;
  fileSizeBytes: number | null;
  fileModifiedAt: string;   // локальная строка даты/времени
  hashAlgo: InfoSheetHashAlgo;
  fileHash: string;
  // шаг 2 — шапка
  objectName: string;
  // шаг 3 — таблица документов (одна строка MVP)
  docDesignation: string;
  docName: string;
  docVersion: string;
  // шаг 4 — подписи
  signatures: InfoSheetSignature[];
  // шаг 5 — колонтитул
  ulCode: string;
  sheetNo: string;
  sheetsTotal: string;
  lastGenerateNote?: string;
}
```

На `DocItem` при `kind === "info_sheet"` хранить `iulWizard: InfoSheetWizardState` (waybill продолжает использовать `wizard`).  
`createDocument` / `ensureDemoWorkspace` / `regenerateDocument` инициализируют пустой `iulWizard` для info_sheet.

Блоб исходного PDF — опционально в IndexedDB (`saveDocTemplate` reuse или `saveDocDataFile`) только локально; **хэш считается в браузере**, байты на backend не отправляются.

## UI — шаги

| Шаг | Название | Содержание |
|-----|----------|------------|
| 1 | Файл | Drag/input PDF; алгоритм хэша; автополя имя / размер / дата / хэш (editable) |
| 2 | Шапка | Наименование объекта |
| 3 | Документ | №п/п=1, обозначение, наименование, версия |
| 4 | Подписи | Список + «Добавить подпись» |
| 5 | Колонтитул + PDF | шифр УЛ, лист/листов; «Сформировать PDF» |

Справа: `InfoSheetLivePreview` — табличный макет как на референсе (шапка, таблица документов, блок файла, подписи, футер).

Компоненты:
- `frontend/components/docs/InfoSheetWizard.tsx`
- `frontend/components/docs/InfoSheetLivePreview.tsx`
- `frontend/lib/iul-hash.ts` — MD5/SHA-1/SHA-256/CRC32 над ArrayBuffer
- `frontend/lib/iul-pdf.ts` — сборка A4 PDF (jspdf) + имя `{basename}_УЛ_YYYY-MM-DD.pdf`

Страница `info-sheet/page.tsx` → `InfoSheetWizard` вместо `WaybillWizard`.

## Хэш (C-62)

- Web Crypto: SHA-1, SHA-256
- Pure JS: MD5, CRC32 (без отправки файла)
- Смена алгоритма при уже загруженном файле → пересчёт (держать ArrayBuffer в `useRef` / state session)

## PDF (C-63)

Клиентский `jspdf` (новая зависимость frontend). Табличная вёрстка ИУЛ A4. Скачивание через `triggerDownload`. Persist `lastGenerateNote` + `status: ready`.

## Non-goals этой волны

- Режим «несколько документов» (на gostcheck за логином)
- Backend API / хранение хэша на сервере
- Проверка валидности ЭЦП внутри PDF (достаточно факта загрузки подписанного файла пользователем)
- UKЭП / экспертиза 2026 — только UI-дисклеймер текстом при желании

## Acceptance (языком Клиента)

1. Открыл ИУЛ → видит шаги файла/шапки/документа/подписей/PDF, не шаги накладной.
2. Загрузил PDF → поля хэша и мета заполнились сами; могу поправить.
3. Заполнил остальные шаги → «Сформировать PDF» → файл скачался, размер > 0.
4. Desktop 1440 и mobile без горизонтального скролла мастера.

## Chain

См. `chain.md`
