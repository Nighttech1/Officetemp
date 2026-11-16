# Guards — C-30 cinematic showcase / below-fold visibility

## Regression guards

1. **No CSS hide on reveals**  
   Forbidden: any rule `.landing-reveal { opacity: 0 }` (or `visibility: hidden`) outside of an explicit temporary GSAP inline style that is cleared.  
   `frontend/app/globals.css` must keep the comment forbidding permanent CSS hide; reduced-motion must force `opacity: 1`.

2. **LandingMotion failsafe**  
   `LandingMotion.tsx` must call `revealAll()` on mount **and** within ~100ms.  
   Scroll section motion may animate `y` only — must not leave elements at `opacity: 0` waiting for ScrollTrigger.  
   Any ScrollTrigger tween uses `immediateRender: false`.  
   Lenis only when viewport `> 767px`; destroy on unmount. Document height must remain scrollable (no Lenis that collapses layout).

3. **Cream sections painted**  
   Tall desktop full-page capture (~1440×4200 or equivalent scroll height) of `/` must show cream (`#ECE9E2` / `bg-landing-cream`) content after hero — manifesto → showcase → process visible without scrolling into a blank void.  
   Guard metric: cream-ish pixel share on a tall full-page screenshot **> 8%** (regression was ~0.9%).

4. **C-31 cinema without foreign media**  
   Showcase desktop: sticky pin + horizontal rail translate (GSAP). Mobile: vertical stack, no `body`/`html` overflow-x.  
   Process: stacked cards with giant ghost numbers; no WebGL, no third-party video embeds.

5. **C-32 editorial**  
   Manifesto headline must be full Russian (no «Formatting Breaks»).  
   Hero «ДОКУМЕНТЫ» fully legible at ~390px (`landing-hero-word` / nowrap + clamp).

## How to verify (localhost)

1. Open `http://localhost:3000/` — all below-fold sections readable immediately after hard refresh (even before scrolling).
2. Desktop ~1440: scroll showcase — pin + horizontal cinema; process cards stack/pin; cream band visible in tall screenshot.
3. Mobile ~390: single column showcase; no page horizontal scroll; «ДОКУМЕНТЫ» not clipped.
4. Toggle OS reduced-motion — content stays visible, no blank page.
