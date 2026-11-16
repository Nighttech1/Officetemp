# Guards C-190 / C-191 / C-192 — RubiksCubeHero

## Source
- [x] `'use client'` on `frontend/components/webgl/RubiksCubeHero.tsx`
- [x] Grid skips center `(0,0,0)` → 26 cubies
- [x] `RoundedBox` + shared plastic/sticker materials
- [x] `DEFAULT_RUBIKS_COLORS` + `colors` prop override
- [x] Cycle assemble → explode → hang → reassemble via `useFrame` + `MathUtils.lerp`
- [x] Canvas `dpr={[1, 2]}`
- [x] `frameloop={inView ? "always" : "never"}` (pause offscreen)
- [x] `prefers-reduced-motion` → no explode twist
- [x] Demo route `/demo/rubiks-cube` with headline + CTA + cube

## Live localhost
- URL: http://127.0.0.1:3000/demo/rubiks-cube
- HTTP 200, page title OK, console errors = 0 (desktop probe)
- Visual assemble: `C-190/.../after-desktop-1440.png`
- Visual explode: `C-190/.../after-explode-1440.png`
- Mobile iPhone: `C-191/.../after-iphone.png` (stack + explode visible)
- Mobile Android: `C-191/.../after-android.png`

## Deps (npm cache in Tools)
- `three`, `@react-three/fiber`, `@react-three/drei` installed in `frontend/`
- npm cache: `E:\Applications\Tools\downloads\npm-cache`
- Node: `E:\Applications\Tools\node`
