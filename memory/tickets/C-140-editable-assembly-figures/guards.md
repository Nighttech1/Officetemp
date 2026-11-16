# Guards — C-140 editable assembly figures

## Checks
- [x] Config path: `frontend/content/assembly-figures.json`
- [x] Scene: `frontend/components/landing/AssemblyScene.tsx` reads JSON
- [x] 8 figures on desktop hero (`data-assembly-figure`)
- [x] Types: disc | cylinder | cone | ring | bar | capsule
- [x] Skill added: `.cursor/skills/assembly-figures/SKILL.md`
- [x] Changing JSON changes scene without rewriting JSX (contract documented in skill)

## How to change figures
1. Edit `frontend/content/assembly-figures.json`
2. Change `type`, `color`, `x/y`, `w/h`, `scatter`, `delay`
3. Reload localhost — figures update

## Re-check
```js
document.querySelectorAll('[data-assembly-figure]').length // >= 5
```
