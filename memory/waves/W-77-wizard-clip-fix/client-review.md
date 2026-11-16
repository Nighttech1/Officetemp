# W-77 Client Review (Playwright)

## Rules updated
- `.cursor/rules/client.mdc` + `client-review/SKILL.md`: Playwright + user scenarios every acceptance; do not return to user while P0/P1 open.

## C-210 probe
```
python memory/waves/W-77-wizard-clip-fix/probe_clip.py
→ PASS — overflowY=auto, clippedHidden=[]
```
Screens: `visual/after-iul-1440.png`, `visual/after-waybill-1440.png`

**Вердикт: ПРИНЯТО** (P0 clip closed with Playwright evidence)
