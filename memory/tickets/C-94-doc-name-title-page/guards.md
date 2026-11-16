# Guards C-94 — наименование с титула

## Авто
```text
cd backend
python -m pytest tests/test_iul_stamp.py -q
```
Ожидание:
- `test_analyze_kj62…`: doc_name содержит «несущие» / «Секция», **не** «Общие данные»
- `test_title_page_doc_name_never_obshie_dannye`
- `test_title_page_multiline_pd_section` (Раздел/Часть/Корректировка)

## Ручная
Загрузить `templates/56-0321-ОК-1-2-КЖ6.2.pdf` → в ИУЛ наименование =
«Вертикальные несущие конструкции на отм. -4.100, …, -3.400. Секция 2»
