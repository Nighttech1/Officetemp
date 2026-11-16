# Architect — W-45 C-101 + C-102

## C-102 (сначала — данные)
В `_pick_doc_name_between_doctype_and_cipher` сейчас побеждает **самый длинный** кусок → с чертежа уезжают примечания.
Исправление:
1. Брать **хвост** перед шифром (1–3 коротких строки), не весь span.
2. Отбраковка `_looks_like_doc_notes` (ГОСТ, «разработана в соответствии», len>220…).
3. Скор: короткие «конструкц/отм/секц/плит» > длинный мусор.
4. Если титул вернул notes — fallback на имя из файла (`_filename_hints`).

## C-101
Пересобрать `iul-pdf.ts` + `InfoSheetLivePreview` по `reference-iul.png`:
- объект: 2 ячейки
- MD5 | hash отдельной строкой
- футер: 4 ячейки как штамп

## chain
1. Backend `iul_stamp.py` + tests (C-102)
2. Frontend `iul-pdf.ts` + LivePreview (C-101)
3. Tester → Fixer → Deployer → Client
