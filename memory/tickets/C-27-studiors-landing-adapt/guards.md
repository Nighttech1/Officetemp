# Guards — C-27 studiors landing adapt

## Regression guards

1. **No login redirect on `/`**  
   `frontend/app/page.tsx` must render `<LandingPage />` (or equivalent marketing shell).  
   Forbidden: `router.replace("/login")` / `redirect("/login")` as the only root behavior.

2. **Brand & copy**  
   Hero must show brand **DocSaaS** and Russian product copy (DOCX/PDF, Word, Excel/Google/Yandex, 152-ФЗ).  
   Forbidden: studiors logo, studiors video assets, purple marketing gradients, WebGL canvas on `/`.

3. **Section anchors**  
   Nav links `#capabilities`, `#method`, `#contact` resolve to elements with those `id`s.  
   CTA paths: `/login`, `/register`, `/contact` remain reachable from landing.

4. **Visual rhythm**  
   Landing uses alternating `landing-dark` (`#0E0E0D`) and `landing-cream` (`#ECE9E2`); teal (`#2DD4BF`) only on CTAs.

5. **Motion fallback**  
   With `prefers-reduced-motion: reduce`, content is visible without relying on GSAP/Lenis loops.  
   **Forbidden regression:** CSS rule `.landing-reveal { opacity: 0 }` under `prefers-reduced-motion: no-preference` — leaves blank page if JS fails. Motion must use `gsap.from` + `clearProps` / failsafe timeout, never permanent CSS hide.

## How to verify (localhost)

1. Open `http://localhost:3000/` — marketing landing appears immediately (not login form).
2. Desktop ~1440: hero dual-type readable; marquee present; cream/dark sections alternate.
3. Mobile ~390: single column; burger menu; finger scroll works; CTAs tappable (≥44px).
4. Click Регистрация → `/register`; Войти → `/login`; Связаться → `/contact`.
