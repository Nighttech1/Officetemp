# Guards — C-47

- `rowFrom` / `rowTo` в wizard (1-based)
- UI `RowRangePicker` на шагах 3 и 4
- `resolveRowRange` + `buildWizardContext` режет `rows` и собирает списки `row.*`
- После загрузки Excel диапазон = 1…N
