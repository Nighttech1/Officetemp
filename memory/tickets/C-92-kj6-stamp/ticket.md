### [C-92] Штамп 56-0321-ОК-1-2-КЖ6.2.pdf не заполнял ИУЛ

- **Статус:** done (W-39)
- **Причины:** (1) fuzzy «Н.контр» съедал фамилию Романов; (2) шифр резался; (3) Next proxy резал PDF >10 МБ (~12 МБ файл).
- **Исправление:** парсер + `middlewareClientMaxBodySize: 50mb`.
- **Доказательство:** `parse-result.json`, `visual/after-preview.png`, pytest + live UI.
