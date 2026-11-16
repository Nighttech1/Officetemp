# W-54 guards

## C-130 Tree DnD
- [ ] Файл в дереве draggable (cursor grab)
- [ ] Drop на папку → `moveDocument`; multi-select → все id
- [ ] Drop в «Подписи» → alert, без переноса

## C-131 UX
- [ ] `/app/documents/waybills` — нет h1 «Накладная №…»
- [ ] SlideTabs с отступом сверху (pt у карточки)
- [ ] Hover по бару меняет шаг; вне бара — нет
- [ ] ИУЛ шаг Подписи: переключение ролей без прыжка layout

## C-132 Sheet + seq
- [x] API from-url Google sheet → 56 строк, колонки шифр/наименование
- [x] Строки 31–39 → 9 комплектов КЖ5.2…КЖ13.2
- [x] DOCX `memory/waves/W-54-tree-waybill-sheet/waybill-31-39.docx` (349008 bytes): №п/п = 1…9
- [x] Help: авто-нумерация `{{n}}` + имена без пробелов
- [x] Doc Engine: нормализация `{{section name}}` → `{{section_name}}`

## Localhost
- Frontend: http://127.0.0.1:3001 (proxy → API :8002; :8001 занят зомби)
- API: http://127.0.0.1:8002
