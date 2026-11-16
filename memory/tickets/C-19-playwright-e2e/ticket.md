### [C-19] Playwright E2E + заготовка CI
- **Зона:** Frontend / QA (фаза 5.6)
- **Факт:** Нет стабильного E2E сценария и CI workflow.
- **Ожидание:** `frontend/e2e/` — login/register smoke + protected redirect; `npx playwright test` (или python playwright); GitHub Actions workflow `.github/workflows/e2e.yml` (install + test, services optional).
- **Приоритет:** P0
- **Зона:** Playwright E2E | Frontend
