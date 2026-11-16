# Trainer grade — W-86 / 2026-10-03

## План хода
- Preview 1:1 (правый край + без h-scroll); стыковка dropdowns вниз/стиль; убрать шаг Генерация; preview fit после row range (не прыгать); DOCX `w:r_w:`; реестр = connect как шаг 2 + автополя; столбцы со всех листов Google.
- Поверхности: WaybillLivePreview, WaybillWizard, cloud_url/doc_engine render.

## Грейд: B
## Пробелы
| # | Пробел | Роль | Слой | P |
|---|--------|------|------|---|
| 1 | fitWidth по section без overflow header img | Frontend | doc-engine | P0 |
| 2 | Select/Radix dropdown вверх + чужой стиль | Frontend | ui | P1 |
| 3 | Шаг 5 Генерация лишний | Frontend | wizard | P1 |
| 4 | Jinja/normalize ломает `w:r` → `w:r_w:` | Doc Engine | render | P0 |
| 5 | Реестр без from-url UX | Frontend | google-sheets | P0 |
| 6 | columns только с выбранного листа | Google Sheets | cloud_url | P1 |

## Вердикт
Команда готова → Архитектор → FE + Doc Engine + Google Sheets
