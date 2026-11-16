### [C-192] RubiksCube — reduced-motion + pause offscreen
- **Зона / Экран:** `RubiksCubeHero`
- **Факт:** WebGL без fallback и pause вне viewport недопустим по three-webgl-craft.
- **Ожидание:** `prefers-reduced-motion` → статичный постер; IntersectionObserver → pause rAF; parallax мыши без блокировки скролла.
- **Приоритет:** P1
- **Зона:** WebGL
