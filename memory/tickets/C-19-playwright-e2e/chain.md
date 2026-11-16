# Chain — W-06 (C-18, C-19, C-20)

1. Backend — load_test script + smoke pytest
2. Playwright E2E — e2e suite + GitHub Actions workflow
3. Frontend / a11y-critic — accessibility fixes + report
4. Tester — run load smoke, e2e, a11y checks + guards
5. Fixer → Deployer (ensure api+fe up) → Client

Paths: `backend/scripts/load_test_jobs.py`, `backend/tests/test_load_smoke.py`, `frontend/e2e/**` or `backend/scripts/e2e_*.py`, `.github/workflows/e2e.yml`, `frontend/app/**` a11y edits, `memory/tickets/C-20-a11y-audit/report.md`

No VPS. No DB wipe.
