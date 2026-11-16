# Guards C-75 — batch ZIP + templates acceptance

## Прогон (авто)
- Скрипт: `run_batch_accept.py`
- Источники: 4 PDF из `templates/`
- Результат: `artifacts/IULy_2026-09-24_15-09.zip` (11331 байт)
- Внутри ZIP: **4** ИУЛ-PDF (`unzipped/`)
- Скрин: `01-ready.png`, `02-after-batch.png`, `03-after-download.png`
- report: `artifacts/report.json` → `ok: true`, `Создано ИУЛов: 4`

## Сверка Клиента
- Скрипт: `compare_iuls.py` → `artifacts/compare.json`
- Для **каждого** из 4 исходников:
  - есть парный ИУЛ в архиве (имя `{stem}_УЛ_…pdf`)
  - в тексте ИУЛ есть **SHA-256** исходного PDF
  - в тексте ИУЛ есть **размер файла** исходника
  - ИУЛ ≥ 1 KB, валидный `%PDF`
- Итог: `all_ok: true`, `matched_ok: 4/4`

## UI
- Кнопка пакетного режима: **«Скачать ИУЛы»** → один ZIP (`lib/zip-download.ts` + fflate)
