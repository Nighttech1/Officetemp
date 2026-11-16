# W-71 Architect Spec

## Palette (C-193)
- plastic: `#F7F7F5` (landing.cream / header)
- sticker white: `#FFFFFF`
- one face green: `#22C55E` (brand.DEFAULT) on **front** (+Z)
- other 5 faces: white
- demo page + canvas glow: soft cream / light green wash (не тёмный void)

## Kinematics (C-194)
Replace explosion with true layer turns:

1. Each cubie keeps logical grid pos + quaternion orientation; stickers parented to cubie.
2. Move = `{ face: R|L|U|D|F|B, dir: 1|-1 }` (90° RH around outward axis).
3. Animate active layer with `applyAxisAngle` over eased progress.
4. On complete: snap pos to {-1,0,1}, bake orientation.
5. Fixed scramble of **10** moves → hang → **reverse inverted** sequence → idle → loop.

## Timeline (~18s)
- idle assembled ~2.2s
- scramble 10 × 0.48s
- hang ~1.4s
- solve 10 × 0.48s
- settle ~1.2s

## Paths
- rewrite `frontend/components/webgl/RubiksCubeHero.tsx`
- tune `frontend/app/demo/rubiks-cube/page.tsx` (light theme)

## Chain
WebGL → Frontend (demo polish) → Tester → Fixer → Deployer → Client
