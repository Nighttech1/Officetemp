# Guards — C-20 A11y

## Checks

1. View source / DOM: `<html lang="ru">`
2. `/login`: skip link `a.skip-link[href="#main"]`; `<main id="main">`
3. Labels: each Field has `label[htmlFor]` matching `input#…` (email, password, org, etc.)
4. Tab through login — visible focus ring (teal outline/ring)
5. `/app/*` shell: `<main id="main">` landmark after AuthGate

## Report

See `report.md` in this folder (issues found + fixed).

## Automated companion

```bash
cd backend
# optional live FE
.venv/Scripts/python.exe -m pytest -q tests/test_e2e_cabinet.py -m e2e
```

No design-token purple; keep `--color-brand` teal.
