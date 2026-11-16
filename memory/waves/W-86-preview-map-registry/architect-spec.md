# W-86 Architect spec

## Scope (P0)

1. Preview 1:1 — no right-edge clip; expand section to content extent; no h-scroll.
2. Mapping dropdowns — `FieldSelect`, open downward, app radii.
3. Remove Generation step → 4 steps: Template / Data / Mapping / Registry.
4. Preview fill only after row range set; debounce; no flash (staging DOM).
5. DOCX `w:r_w:` — skip Jinja normalize when match contains XML (`<>`).
6. Registry — cloud connect like step 2; left fields from template tags.
7. Columns union from all sheets (Excel + Google).

## Chain

Trainer → Architect → Backend (render + cloud_url + excel) → Frontend (preview + wizard) → Tester → Fixer → Deployer → Client
