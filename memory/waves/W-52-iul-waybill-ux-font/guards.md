# Guards W-52 (C-124 / C-125 / C-126)

## C-124
- Дерево ИУЛ: label = docDesignation / ulCode (не полное наименование)
- Раздел ИУЛ: нет кнопки «Сформировать накладную»
- Накладная: DOCX+PDF внутри карточки мастера рядом с шагами (как PDF в ИУЛ)

## C-125
- Подписи: TabsContent forceMount + min-h + inactive absolute — плашки не прыгают
- `iul-pdf.selftest` OK; колонки/высоты из `ИУЛ template.docx`

## C-126
- PreferencesCard на всю ширину; «Подключить» в одной линии с полем ссылки
- Таблица выбранных ИУЛ: text-center
- HelpHoverPopover как LoginPopover
- Century Gothic; кегль 10–16px (tailwind + globals)
- Тексты шпаргалок упрощены

## Localhost
- FE :3000, API :8001 — 200 / health ok
