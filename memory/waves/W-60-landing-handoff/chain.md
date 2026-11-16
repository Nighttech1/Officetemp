# Chain — W-60

1. **Архитектор** — spec ✓
2. **Landing Promo** + **Frontend** — C-148, C-149, C-145 (paths below)
3. **Motion** — soft blob drift + hero line reveal still works; reduced-motion
4. **Тестировщик** — Playwright evaluate fontSize ≥38px; screenshots after; anti-slop
5. **Фиксер** — до зелёного
6. **Деплоер** — localhost :3000
7. **Клиент** — повторная приёмка

## Paths (no overlap conflict)

- `frontend/app/globals.css` — C-148 scope + grain utility
- `frontend/app/(marketing)/` or root layout for landing `data-landing` — C-148
- `frontend/app/(app)/` or app layout — `data-ui-floor="app"` if needed
- `frontend/components/landing/Hero.tsx` — C-145/149
- `frontend/components/landing/HeroAtmosphere.tsx` — NEW C-149
- `frontend/components/landing/AssemblyScene.tsx` — scale C-145
- `frontend/components/landing/LandingMotion.tsx` — soft atmosphere if needed
- `frontend/DESIGN.md` — note type unlock if needed (minimal)

Backend paths: none.
