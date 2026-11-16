# Guards — C-21 Dark motion UI

## Checks

1. `frontend/DESIGN.md` describes **dark** zinc surface `#09090b`, brand teal/cyan `#2DD4BF` — **no purple**.
2. Pages `/login`, `/register`, `/app`, `/app/templates`, `/app/mapper`, `/app/generate` use dark tokens + `GlassCard` / `FadeIn` where applicable.
3. Components exist: `components/ui/AuroraBackground.tsx`, `GlassCard.tsx`, `FadeIn.tsx` (optional `ShimmerButton.tsx`).
4. `package.json` depends on `motion`; FadeIn imports from `motion/react`.
5. `prefers-reduced-motion`: aurora keyframes paused in `globals.css`; FadeIn skips animation via `useReducedMotion`.
6. A11y preserved: skip-link → `#main`, Field labels, focus-visible cyan on dark offset.
7. `npm run build` / `next build` succeeds.

## Manual visual

- Desktop ~1440 and mobile ~390: dark glass login, teal glow, no purple gradients.
