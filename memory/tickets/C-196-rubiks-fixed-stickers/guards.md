# Guards C-196

- [x] `StickerDef = { face, color }` baked in `bakeStickers` once per cubie
- [x] No runtime `stickerColor()` / no world-face remapping
- [x] Materials in `matByColor` Map keyed by baked hex; `.color` never mutated in useFrame
- [x] Animation only writes `position` + `quaternion` on cubie groups
