# W-54 client-review

## Вердикт волны: ПРИНЯТО С ЗАМЕЧАНИЯМИ

### C-130 DnD
Код: TreeView HTML5 DnD + moveDocument (мультивыбор). На живом UI в этой сессии полный drag не прогонялся мышкой — нужна ручная проверка пользователем.

### C-131 UX
- Заголовок `doc.title` («Накладная №001») убран из мастера; из шапки превью тоже убран.
- SlideTabs: отступ сверху + hover-переключение по бару.
- Подписанты: TabsContent всегда absolute — без смены relative/absolute.
Скрины: `waybills-after.png`, `iul-sigs-step3.png`.

### C-132 Sheet + №п/п
- Google Sheet подключён (export xlsx), строки 31–39 = 9 комплектов (КЖ5.2…КЖ13.2).
- DOCX скачан: `waybill-31-39.docx`, №п/п = 1…9, шифры и наименования на месте.
- Инструкция шаблона обновлена; движок нормализует пробелы в тегах.
- **Замечание:** файл `templates/invoice template.docx` был заблокирован Word — рабочая копия `invoice template seq.docx`. Закройте Word и подмените оригинал.

### Prod
Не деплоим. Localhost для приёмки.
