# Architect spec — W-24 C-56 / C-57

## C-56
- `generateDocx` / `generatePdf` / `apiMultipartBlob`: перед запросом `ensureDevSession`.
- Обёртка `fetch`: TypeError `Failed to fetch` → ApiError с текстом про API URL и обновление страницы.
- E2E: шаблон `user_template.docx`, Google URL с **рабочим** spreadsheet id `1cucynWgxo3korll0CyESQSSVQXtCCom4XhA8ZmPRMqU`, скачать DOCX на шаге 4.

## C-57
- Уже в `client.mdc`; продублировать в `client-review/SKILL.md`.
- Guard: путь артефакта + size + краткое сравнение с оригиналом (ZIP PK / размер / теги заполнены).
