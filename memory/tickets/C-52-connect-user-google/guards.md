# Guards — C-52

## Verified 2026-09-23 (Client E2E)
- URL пользователя: `…/d/1cucynWgxo3korll0CyESQSSVQXtCCom4XhA8ZmPRMqU`
- Шаблон: `Накладная1 от 09.09.26.docx` → `user_template.docx`
- После «Подключить»: 12 листов в combobox, авто-лист «График выдачи КЖ с заданиями», 36 кол. / 56 строк
- Шаг 3: 5 стыковок {{NN}}, {{date}}, {{number}}, {{name}}, {{code}}
- Шаг 4: DOCX скачан, статус документа «готов»
- Doc SaaS на http://127.0.0.1:3001 (порт 3000 часто занят ITLearn)

## Regression
1. from-url без sheet_name → не первый пустой лист, а scored best
2. ensureDevSession перед fetchCloudTable
3. header-row detection для титульных строк Google
