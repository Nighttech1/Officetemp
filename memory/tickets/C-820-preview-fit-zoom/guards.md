# Guards C-820 (pan document-only)

## Closed only with
1. After hard pan drag, `translate(x)` satisfies `x >= viewportWidth - docWidth` (no slack into void).
2. Toolbar remains clickable outside pan zone.

## W-84 evidence
- `client_e2e_w84.json` → C-820-pan-document-only ok (`x=-360`, `vw=486`, `docW≈846`)
