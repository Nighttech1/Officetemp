# Guards C-197

- [x] `randomScramble(seed, 10)` — no same face twice in a row
- [x] `solve = invertSequence(scramble)` exact reverse
- [x] Cycle: idle (green top) → scramble 10 → hang → solve 10 → settle → idle
- [x] New random seed each cycle (`1000 + cycle * 9973`)
- [x] visual scramble: greens scattered, cube intact (no explosion)
