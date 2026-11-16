# Guards — W-61 (C-151, C-157, C-154)

Probe: `probe_w61.py` → `probe.json`

## C-151 — bento materials
- Pillars: 3 tiles, `borderTopWidth` = **1px**, rounded cards with gradient fill
- ProductTrio: numbered 01–03 cards with border hover
- Screens: `after-pillars-1440.png`, `after-trio-1440.png`
- 21st inspiration: bento **9594** (adapted)

## C-157 — FAQ
- `#faq` present, **5** accordion buttons
- Cream plane before ContactCTA
- Screens: `after-faq-1440.png`, `after-faq-open-1440.png`
- 21st inspiration: accordion card **29935** (adapted)

## C-154 — mobile density
- iPhone 390: `gapCtaToScene` = **20px** (was ocean of grey)
- `sceneVisible` in first viewport = true
- `heroH` 726 vs `vh` 844 (no forced empty 100dvh sheet)
- Screens: `after-hero-iphone.png`, `after-hero-android.png`

## Regression
- Desktop h1 still **97.6px** (W-60 C-148 intact)
- anti_slop_scan landing → OK

## Note
MCP Playwright/image-compare were loading; visual proof via Python Playwright Chromium.
