# W-48 guards (C-109…C-111)

## Playwright localhost `http://127.0.0.1:3000/app/documents/waybills`

### C-109 Tree UX
- Папки открываются/закрываются кликом (mouse) — `data-expanded` true→false, дети исчезают.
- Боковые guide-lines: `showLines={false}`, в DOM нет tree-line.
- Подсветка выбора: ширина ~иконка+подпись (пример selW≈76 при aside≈296), не на всю ширину.
- Resize: separator «Изменить ширину дерева», drag 296→353, ширина в localStorage `docsaas_sidebar_w`.
- Screen: `screens/waybills-tree-after.png`

### C-110 Подписи
- В дереве нет узла «Подписи» (filter `systemKey !== "signatures"`).

### C-111 ИУЛ в накладных
- Выбор ИУЛ на `/waybills` **не** уводит со страницы (URL остаётся waybills).
- Счётчик «Выбрано ИУЛ: N» сохраняется при свернуть/развернуть проект.
- Шаг «Данные»: блок «Информация из ИУЛ» + «Подставить выбранные ИУЛ (N)».
- Шаг «Стыковка»: колонки из ИУЛ + selects по тегам шаблона.
- Генерация до скачивания:
  - DOCX: `artifacts/waybill_template_filled.docx` (37008 bytes)
  - PDF: `artifacts/waybill_template_filled.pdf` (1009624 bytes)
- Сравнение с шаблоном `memory/waves/W-20-wizard-e2e/waybill_template.docx`:
  - оба валидные ZIP/DOCX с `word/document.xml`
  - в filled есть таблица (`w:tbl`)
  - шаблонные `{{…}}` / `{%tr for` в filled отсутствуют (подстановка прошла)

## Regression
Не чистить multi/selectedIulIds при клике по тому же проекту (раскрытие дерева).
