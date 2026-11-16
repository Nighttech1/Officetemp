# Guards C-102 — имя документа не примечания

## Авто
```text
cd backend && python -m pytest tests/test_iul_stamp.py -q -k "doc_name_rejects or title_page"
```
Ожидание: `test_doc_name_rejects_drawing_notes_c102` зелёный; «несущие» есть, «гост/разработана» нет.

## Ручная
Загрузить КЖ10.1 → наименование = «Вертикальные несущие конструкции… Секция 1», не абзац про ГОСТ.
