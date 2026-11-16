# Guard W-24 / C-56 / C-57

## Cause
- Шаг 4 «Failed to fetch»: генерация шла без гарантированного JWT (`ensureDevSession`) + сырой сетевой текст; при недоступном API браузер показывал `Failed to fetch`.
- В UI часто битый Google id (`…xa3…Com4…` → export **404**). Рабочий: `1cucynWgxo3korll0CyESQSSVQXtCCom4XhA8ZmPRMqU`.

## Fix
- `frontend/lib/api.ts`: `ensureDevSession` перед blob-генерацией; понятная ошибка вместо `Failed to fetch`.
- `client.mdc` + `client-review/SKILL.md`: жёстко — скачать готовый файл и сравнить с оригиналом до «согласовано».

## Playwright E2E (localhost FE:3010 API:8001)
- step1 template OK (`user_template.docx`)
- step2 Google connect OK (12 листов, 56 строк «График выдачи КЖ…»), authErr=0
- step3 mapping 5 selects
- step4: UI «Скачан DOCX…», `hasOkMessage=true`, `uiErr=null`, preview с таблицей данных
- Артефакт: `memory/waves/W-24-download-fix/client-downloaded.docx` (**199830** байт, PK/ZIP OK)
- Оригинал: `memory/waves/W-22-user-google-connect/user_template.docx` (**230345** байт)
- Сравнение: оба валидные DOCX; в заполненном **нет** сырых `{{…}}`; в XML есть реквизиты заказчика/шифр объекта из данных; скрины `step1`…`step4-after-download.png`
