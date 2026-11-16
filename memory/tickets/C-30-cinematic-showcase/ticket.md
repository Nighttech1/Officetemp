### [C-30] Ниже hero контент невидим / «пустой» скролл
- **Зона:** Motion / Frontend
- **Факт:** Tall screenshot 1440×4200: cream ≈0.9% пикселей — секции manifesto/showcase/process с `bg-landing-cream` не читаются на live; GSAP ScrollTrigger/`landing-reveal` оставляют ниже fold пустоту или opacity 0.
- **Ожидание:** После hero сразу видны manifesto → cream showcase → process → capabilities → contact. Без JS и при reduced-motion — тоже видимы. Failsafe: никогда не держать секции скрытыми после mount.
- **Приоритет:** P0
- **Статус:** done
- **Зона:** Motion | Frontend
- **Fix:** LandingMotion — только `y`, без opacity hide; `revealAll` immediate + 100ms; Lenis desktop-only; ST `immediateRender: false`. Guards: `guards.md`.
