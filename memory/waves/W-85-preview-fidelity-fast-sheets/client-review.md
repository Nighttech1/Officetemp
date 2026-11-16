# W-85 Client review

## Google (C-853)
- Spreadsheet `1vI8fUt1…`, лист «Журнал выдачи ПД 2026», gid `124580750`
- HTTP `/from-url`: **200**, `via=export_csv_gid`, 3506 rows × 19 cols, есть «Шифр объекта»
- 1-й connect ≈ **3.3 s** (сеть Google); 2-й из TTL cache ≈ **246 ms**
- Полный `.xlsx` при известном gid **не скачивается**

## Preview (C-851 / C-852)
- Floating header: `position:absolute`, wrapper 0×0, Word `margin-top: calc(-68.4px)` сохранён
- Pan: класс `--pan`, `user-select:none`, выделение текста при перетаскивании = 0
- Viewport `overflow:auto` (меньше обрезания серой рамкой)
- Шрифты тела из Word: **Calibri** (как в .docx)

## URL для пользователя
`https://docs.google.com/spreadsheets/d/1vI8fUt1GrdYT1J4xryJl5Mr8MF782hov7dIBdkLR-Mo/edit#gid=124580750`
