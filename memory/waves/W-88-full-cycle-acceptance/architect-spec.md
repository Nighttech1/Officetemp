# W-88 Architect

## Root cause user still sees bugs
Localhost API+FE were **down**; Docker Desktop off. Code patches from W-86/87 never reached the browser.

## P0 verify live
1. Preview: no fill without rowRangeConfirmed; no right clip; no h-scroll; center cells
2. Multi-sheet select + portal dropdown
3. Registry tab opens (step 4)
4. Tree: project → after generate file with number
5. DOCX download without w:r_w:

## Chain
Deployer (postgres/redis/api/fe) → Playwright probe → Fixer if red → Client
