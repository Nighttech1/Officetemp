# Architect spec — W-77

## Тикеты (≤3)

| ID | Суть |
|----|------|
| C-209 | Единый min-height шагов ИУЛ; сайдбар stretch; `.scrollbar-brand` на дереве |
| C-210 | TreeView expand ≤100ms, без «тяжёлого» height:auto |
| C-212 | Waybill: как ИУЛ C-207 — без FadeIn, useLayoutEffect, DocsStepMotion animate только по setStep; min-height карточки |

## Общее для ИУЛ + накладных

- `ProjectSidebar` + `TreeView` + `scrollbar-brand` — один раз, оба раздела.
- Паттерн мастера: стабильный каркас, анимация шага только по клику.

## Acceptance

1. Шаги 1/2/3 ИУЛ — нижняя грань карточки на одном уровне.
2. Дерево тянется по высоте, скролл тонкий зелёный.
3. Клик по папке — раскрытие сразу (~0.1s).
4. Накладные: смена документа без fade; та же плотность карточки.
