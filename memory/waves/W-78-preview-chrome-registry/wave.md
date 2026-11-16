# W-78 — preview / chrome / registry buttons

## Tickets
- C-211 preview fit height (P0)
- C-212 signatures plaques + chrome layout (P0)
- C-213 registry step 5 buttons (P1)

## Chain
Architect → Frontend → Tester → Fixer → Deployer → Client

## Fixer notes
- TabsList: removed default `justify-center` (clsx без twMerge).
- Preview: `overflow-visible`, new height storage key `docsaas_preview_fit_h_*`.
- Registry save button: smaller `!h-8 !text-xs`.

## Probe
`probe_w78.py` → **W78_PASS** 2026-10-02
