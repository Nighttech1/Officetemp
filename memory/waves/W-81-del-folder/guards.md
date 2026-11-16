# Guards C-225

- BEFORE: MultiButton резервировал ширину под длинные подписи → toolbar ~278–319px, в узком сайдбаре кнопки обрезались (`overflow:hidden`); на Накладных без «Пакет PDF» раскладка другая.
- AFTER: `reserveLabelSpace={false}` → idle иконки 40px (group ~163–204px); «Удалить папку» не clipped на ИУЛ и Накладных.
- Delete folder enabled, если выбрана папка или документ лежит в папке.
