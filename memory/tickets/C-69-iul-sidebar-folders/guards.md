# Guards W-30 (C-69 / C-70 / C-71)

## C-69
- Сайдбар ИУЛ: кнопки «Папка+» / «ИУЛ+»; системная «Подписи» (метка сист.); клик → таблица ФИО|картинка в main.
- ПКМ → Удалить; системную «Подписи» удалить нельзя.
- `rg "systemKey" frontend/lib/docs-store.ts` — есть signatures.

## C-70
- STEPS ИУЛ: Файл, Документ, Подписи, PDF (нет «Шапка»).
- SlideTabs без hover-follow (`onMouseEnter` setPosition отсутствует).
- Кнопка «Сформировать PDF» на линии шагов.
- Preview grid `minmax(420px,570px)`; ✕ у подписанта.

## C-71
- `analyze_stamp_pdf` обходит все страницы score>0; merge (role,surname); фильтр фамилий=ролей.
- `pytest tests/test_iul_stamp.py` зелёный.
