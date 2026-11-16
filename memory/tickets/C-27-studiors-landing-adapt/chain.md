# chain.md — W-11 studiors → DocSaaS landing

## Tickets
C-27 (P0), C-28 (P0), C-29 (P1)

## Order (no overlapping path edits)

1. **Landing Promo** — brief + section copy + DESIGN marketing tokens  
   paths: `frontend/DESIGN.md`, `memory/waves/W-11-studiors-landing/reference/notes.md`
2. **Frontend (профиль A)** — разметка `/`, компоненты landing, убрать redirect login  
   paths: `frontend/app/page.tsx`, `frontend/components/landing/**`, `frontend/app/layout.tsx` (fonts), `frontend/tailwind.config.ts`, `frontend/app/globals.css`
3. **Motion** — GSAP/Lenis reveal, marquee, process; reduced-motion + mobile touch  
   paths: `frontend/components/landing/*motion*`, `frontend/package.json` (gsap, lenis)
4. **Тестировщик** — anti_slop, visual localhost `/`, guards
5. **Фиксер** — до зелёного
6. **Деплоер** — localhost Next dev/refresh
7. **Клиент** — приёмка

## Profiles
Frontend: **A** (Premium Luxury Web / landing)  
WebGL: **нет**  
Backend: **нет**
