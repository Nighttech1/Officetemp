# W-72 Architect Spec

## C-195
`greenFace: "top"`. Home cubies with `y===1` get green sticker on local `top` only.

## C-196
Each cubie stores `stickers: { face: FaceKey; color: string }[]` baked once.
Materials keyed by color hex. Never call stickerColor() during animation.
Animate only `position` + `quaternion` of cubie groups.

## C-197
Incremental timeline (not rebuild scramble mid-cycle):
- On cycle start: `scramble = randomMoves(10, seed=cycleIndex)` (no same-face twice in a row)
- Animate scramble[0..9]
- Hang
- Animate invert(reverse(scramble))
- Settle / idle with green top

## Path
`frontend/components/webgl/RubiksCubeHero.tsx` only
