# Guards C-211

1. `useFrame`: `dt = min(delta, 1/30)`.
2. `active` false→true или `visibilitychange` hidden → `wasActive=false`; resume сбрасывает engine в `idle` assembled.
3. Нет догона пропущенных секунд большим delta.

Код: `RubiksCubeHero.tsx` W-76.
