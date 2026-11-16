# Guards W-80

## C-223 — единое дерево / состояние при смене раздела
- BEFORE: `expanded` в useState → при `/info-sheet` ↔ `/waybills` всё сворачивалось; страница всегда открывала демо-проект
- AFTER: `sessionStorage docsaas_tree_expanded_v1` + `docsaas_tree_ui_v1`
- Evidence: Playwright — expand Жилой дом + АР на ИУЛ → переход на Накладные → те же `openIds`; обратно на ИУЛ — дерево раскрыто

## C-224 — hover шагов
- Restored `onSelect` on SlideTabs hover
- Step persist still does NOT bump tree refreshKey (W-79)
- Evidence: hover «Подписи» → selectedTab=Подписи, heading=«3. Подписи»
