# Guards C-138

- [x] `autoMapTagsToColumns`: `code`→`обозначение`, `section name`→`наименование` (явные мосты)
- [x] Убраны ложные alias-ключи `code`/`section_name` как целевые колонки
- [x] `buildWizardContext` дублирует пробельные теги как `section_name`
- [x] `applyIulsFromTree` async: при пустых tags перечитывает шаблон через analyzeTemplate
- [x] hashAlgo: InfoSheetLivePreview + iul-pdf берут `wizard.hashAlgo` (не литерал MD5 в ячейке)

Regression: выбрать ИУЛ → «Подставить» → в превью `{{code}}`/`{{section name}}` заполняются; смена алгоритма SHA-256 показывает SHA-256 в превью ИУЛ.
