# Architect spec — C-25 Aurora 21st

## Проблема
Blobs opacity низкий; radial overlay `0.85` гасит цвет; нет grid/spotlight характерного для Magic UI.

## Решение (только CSS + существующий AuroraBackground)
1. Поднять opacity blobs 0.55–0.7; увеличить размеры; добавить 4-й soft purple/indigo blob очень слабо ИЛИ второй teal — без purple-bias: остаёмся teal/cyan.
2. Overlay: `rgba(9,9,11,0.55)` + опциональный vignette по краям.
3. Добавить `.aurora-grid` — тонкая сетка `linear-gradient` opacity ~0.06.
4. Spotlight beam: медленный `aurora-beam` vertical soft light (opacity 0.12).
5. `prefers-reduced-motion`: pause animations.

## Acceptance
На скрине login видны цветные пятна teal/cyan; фон не «плоский серый».
