### [C-127] PDF ИУЛ — Times New Roman + жирность как в Word

- **Зона:** `frontend/lib/iul-pdf.ts`, `InfoSheetLivePreview`, `public/fonts`
- **Факт:** В PDF ИУЛ стоит DejaVuSans; жирность заголовков/ячеек не совпадает с `templates/ИУЛ template.docx`.
- **Ожидание:** В скачанном PDF и в превью листа — **Times New Roman**, кегль **10 pt** как в Word; **bold** только там, где в шаблоне `bold=True` (заголовки док/файл/подписи, MD5); значения и «Наименование объекта» — regular.
- **Приоритет:** P0
- **Статус:** done
- **Волна:** W-53
