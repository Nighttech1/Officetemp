# Guards — W-60 (C-148, C-149, C-145)

## C-148 — display type unlocked

- Playwright 1440: `getComputedStyle(h1).fontSize` = **97.6px** (было 18px)
- UI floor scoped: `[data-ui-floor="app"]` only (`frontend/app/app/layout.tsx`)
- Regression: marketing clamp must not be crushed by global `h1 { 18px !important }`

```js
// guard
const fs = parseFloat(getComputedStyle(document.querySelector('h1')).fontSize);
assert(fs >= 38);
```

## C-149 — atmosphere

- `.landing-hero-atmosphere` present
- soft teal/cream blobs + `.landing-grain`
- reduced-motion: CSS animations gated by `prefers-reduced-motion: no-preference`
- 21st inspiration: Floating Gradient id **19381** (adapted, brand palette)

## C-145 — presence

- signature width **48%** of hero (≥40%) — was ~34%
- brand line `DocSaaS` display weight ~32px (not tiny eyebrow only)
- screens: `after-hero-1440.png`, `after-hero-iphone.png`, `after-hero-android.png`
- image-diff vs before: **8.39%** pixels (`diff-hero-1440.png`)

## anti-slop

`python plugins/frontend/anti_slop_scan.py frontend/components/landing …` → **OK**

## Still open (next waves)

C-150…C-161 (bento, FAQ, shimmer CTA, favicon, nav dots, mobile density polish, …)
