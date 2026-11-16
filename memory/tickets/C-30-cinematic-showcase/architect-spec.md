# Architect — W-12 cinema / visibility / editorial

## C-30 (P0) — visibility
- Remove aggressive ScrollTrigger `from { opacity:0 }` on whole-section reveals OR use only transform/y with autoAlpha after in-view and `overwrite`.
- Prefer: sections always painted; animate only `y` + slight fade with `fromTo` starting after ScrollTrigger enters, `immediateRender: false`, and CSS never sets opacity 0.
- Lenis: do not shrink document height; kill Lenis on mobile; `ScrollTrigger.scrollerProxy` only if Lenis used — sync carefully.
- Guard: tall screenshot cream pixel share > 8% on desktop full-page.

## C-31 (P1) — cinema
- Showcase: desktop sticky pin (~120–160vh) + horizontal translate of rail; cards with slight rotate/scale depth; mobile = vertical stack OR native horizontal swipe without body overflow-x.
- Process: stacked full-width cards with giant ghost number, scroll snap / ST pin sequence (4 cards) — soft, not WebGL.
- Paths: `ShowcaseStrip.tsx`, `Process.tsx`, `LandingMotion.tsx`, `globals.css`.

## C-32 (P1) — editorial
- Manifesto: replace English; e.g. «Сломанная вёрстка — больше не ваша проблема.»
- Hero: ensure full «ДОКУМЕНТЫ» at 390 — use `clamp` + `overflow-visible` + optional `white-space: nowrap` with smaller vw.

## Non-goals
WebGL, foreign assets, backend, login redirect.
