# Chain — W-04 (C-11, C-12, C-13)

1. Архитектор — spec (done)
2. **Frontend** — Next.js cabinet under `frontend/` (all three tickets)
3. Тестировщик — `npm run build` + smoke; optional playwright; guards.md
4. Фиксер — до зелёной сборки
5. Деплоер — `next dev` :3000 + API :8000
6. Клиент — приёмка desktop 1440 + mobile ~390

## Paths
Только `frontend/**`, `DESIGN.md` в frontend, при необходимости CORS в backend config (не ломая auth).

Не трогать: Doc Engine core, connectors logic, VPS, 4.5 asset pipeline heavy work (можно next/image без blurhash).
