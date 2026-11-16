# Guards C-212 — плашки + хром

## Regression
1. ИУЛ и Накладные: нет строки «Главная / …» (breadcrumbs).
2. В контуре слева — название раздела (`h1`), справа — пилюли ИУЛ/Накладные.
3. SlideTabs шагов — над карточкой мастера (где раньше был заголовок страницы).
4. Шаг «Подписи»: `[role=tablist]` с `flex-direction: row`, `justify-content: flex-start`, левый край совпадает с формой (±24px).
5. Кнопка «+ Добавить» и плашки ролей в одном горизонтальном ряду сверху слева.

## Probe
`probe_w78.py` → `plaques-horizontal`, `plaques-left-aligned`, `plaques-near-left-edge`, `no-breadcrumb-*`, `title-*`, `steps-*`.

## Status
PASS 2026-10-02 (W78_PASS)
