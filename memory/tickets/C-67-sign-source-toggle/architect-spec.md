# Architect — C-67 Signature source toggle

## UI

На шаге 4 (и/или сразу после загрузки PDF): сегмент-тумблер

```
[ Из библиотеки ]  [ Из PDF ]
```

Состояние: `iulWizard.signatureSource: "library" | "pdf"` (default `"library"`).

## Backend

Расширить `analyze_stamp_pdf` / ответ API:
```json
"signatures": [
  {
    "role": "Разработал",
    "surname": "Зеленцов",
    "signed_at": "2026-09-11",
    "signature_png_base64": "<optional>"
  }
]
```

Вырезка: на странице штампа для каждой строки роли — clip колонки «Подп.» (между фамилией и датой, или по bbox заголовка «Подп.»). PNG RGB, scale ~2–3. Лёгкая очистка: почти-чёрные пиксели сетки → белые (опционально), синие росчерки оставить.

Query/form flag `extract_signatures=true` (по умолчанию true, чтобы один запрос хватал всё).

## Frontend

1. После analyze: хранить `pdfSignatureImages` в session (map surname→dataUrl) в ref/`iulWizard` не раздувать base64 в localStorage сверх меры — держать в `useRef` + при PDF-режиме сразу `upsertSignature` в библиотеку.
2. Тумблер:
   - `library` → `findSignatureImage(surname)`
   - `pdf` → картинка из ответа analyze; `upsertSignature(surname, dataUrl)` для каждой
3. Смена тумблера пересобирает `signatureImageDataUrl` у текущих строк.
4. Если PDF ещё в bufferRef — можно повторно вызвать analyze с extract; иначе показать подсказку «загрузите PDF снова».

## Chain

1. Backend — crop + base64 в analyze
2. Frontend — toggle + apply + library upsert
3. Тестировщик → Фиксер → Деплоер → Клиент
