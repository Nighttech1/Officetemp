---
name: scroll-scrub-video
description: >-
  Build Apple-style scroll-driven video heroes: map scroll progress to
  video.currentTime or a canvas frame sequence (GSAP ScrollTrigger + Lenis).
  Use for scroll-scrub heroes, product cinema on scroll, or when native video
  seeking stutters. Covers all-keyframe ffmpeg encode, blob preload, rAF lerp,
  mobile fallbacks, and prefers-reduced-motion.
---

# Scroll Scrub Video

Native `<video>` seeking is choppy when keyframes are sparse. For frame-accurate scrub on scroll, either:

1. **Re-encode** the clip so every frame is a keyframe, then drive `currentTime` from scroll, or
2. **Extract frames** to an image sequence and paint them on `<canvas>` (best on mobile).

Prefer (1) for short heroes (< ~8s). Prefer (2) when Safari/iOS still stutters.

## Stack (this project)

- Next.js / React
- **GSAP + ScrollTrigger** (official skills: `gsap-scrolltrigger`, `gsap-react`)
- **Lenis** only on desktop if touch is smooth; otherwise native scroll (`mobile-touch-scroll`)
- ffmpeg for encode / frame extract (`asset-pipeline` for posters + WebP/AVIF)

## ffmpeg: all-keyframes encode

```bash
ffmpeg -i input.mp4 -g 1 -keyint_min 1 -sc_threshold 0 -c:v libx264 -pix_fmt yuv420p -movflags +faststart -an public/hero-scrub.mp4
```

Without `-g 1`, scrub snaps between I-frames.

## React pattern (video.currentTime + rAF lerp)

```tsx
// Pin section ~300–500vh tall; sticky inner stage.
// Map scroll progress 0→1 → video.currentTime = p * duration.
// Lerp current toward target (e.g. 0.12–0.18) inside rAF — never set currentTime on every scroll event.
// Blob-preload: fetch → blob URL once for snappier seeks.
// Safari: muted play()+pause() once to prime decode.
```

GSAP alternative: `ScrollTrigger.create({ scrub: true, onUpdate: self => { target = self.progress } })` + same rAF lerp writer.

## Canvas frame sequence (high perf)

```bash
ffmpeg -i input.mp4 -vf "fps=24,scale=1920:-1" public/frames/hero-%04d.webp
```

Map progress → frame index; drawImage on canvas. Ship a lighter fps/resolution tier for `<768px`.

## Accessibility & mobile

- `prefers-reduced-motion: reduce` → show static poster (first or mid frame), no scrub.
- On iPhone: prefer shorter pin distance or image sequence; disable Lenis if touch janks.
- Never block CTA/text behind opaque video without contrast scrim.
- Provide poster via `asset-pipeline` before LCP.

## Do not

- Scrub long-form video (>15s) as a hero — cut a short plate first (`video-edit`).
- Combine Framer Motion scroll + GSAP ScrollTrigger + Lenis on the same axis.
- Animate `width`/`height`/`top` of the video box; only transform the stage if needed.

## Related skills

- `cinematic-scrub-landing` — mouse X scrub + narrative sections
- `parallax-landing-page` — layered scroll without video
- `gsap-choreography` / `vignette` — DOM product walkthrough instead of MP4
- `remotion-best-practices` — author promo loops in React → MP4
- `web-motion-engine`, `web-perf-motion`, `mobile-touch-scroll`
