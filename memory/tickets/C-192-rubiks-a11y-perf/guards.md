# Guards C-192 — a11y / perf

- [x] `prefers-reduced-motion: reduce` disables explode/twist
- [x] IntersectionObserver → Canvas `frameloop="never"` when offscreen
- [x] Mouse parallax via pointermove (passive); no scroll hijack
- [x] `dpr={[1,2]}`; shared materials; Cubie `memo`
