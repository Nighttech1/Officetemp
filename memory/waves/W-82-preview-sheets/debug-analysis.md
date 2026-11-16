# DEBUG analysis — W-82 (после reproduction)

## Вердикты по гипотезам

| ID | Вердикт | Доказательство |
|----|---------|----------------|
| H4 (нет доступа / HTML) | **REJECTED** | `google export response`: status 200, content-type xlsx, magic `504b0304`, `is_zip_pk: true`, nbytes≈6.3MB |
| H4b (парсинг зависает) | **CONFIRMED** | После export нет `export_ok`; `pick_best_sheet_name` перепарсивал каждый лист целиком |
| H5 (blur/busy) | **CONFIRMED** (код) | `onBlur`/`onPaste` → `scheduleConnectFromUrl`; busy на всё время connect |
| H1–H3 preview | **INCONCLUSIVE** (нет FE логов) | Фикс по архитектуре: scale fit + breakPages + не ломать padding колонтитулов |

## Фиксы (инструменты оставлены)

- FE preview: fit scale, zoom/pan toolbar, breakPages, CSS колонтитулов
- FE sheets: только кнопка, «подключаемся…», running green contour
- BE: read_only sample для выбора листа + nrows cap при чтении
