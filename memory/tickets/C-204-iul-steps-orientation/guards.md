# Guards C-204

1. Узкий viewport (~640): `[data-steps-orientation]=vertical`.
2. Верх `[role=tablist]` ≈ верх `h2` шага (delta ≤ 12px) — заподлицо со строкой шага («Загрузка PDF…» / «Документ…»).
3. После расширения до 1440: снова `horizontal` без reload.
4. Fit меряется по `[data-slide-tabs-fit]`, не по узкой колонке табов.

Проверено W-75: narrow vertical + align delta=0; restore horizontal.
