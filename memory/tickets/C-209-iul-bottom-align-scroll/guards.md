# Guards C-209

1. Desktop: высота `.glass-card` одинакова на шагах ФАЙЛ / ДОКУМЕНТ / ПОДПИСИ (spread ≤ 4px).
2. `card.bottom === aside.bottom` (дерево и карточка мастера на одной нижней линии).
3. Дерево: контейнер с классом `scrollbar-brand` (тонкий зелёный скролл).

Проверено W-77: spread=0, delta=0, hasBrand=true (ИУЛ + накладные).
