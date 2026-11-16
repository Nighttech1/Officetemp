# Chain — W-02 (C-04, C-05, C-06)

1. **Архитектор** — spec (этот каталог)
2. **Doc Engine** — render.py, pdf_convert.py, fixtures, unit tests flat + tr_for
3. **Template Analyzer** — template_analyzer.py + analyze tests (broken runs)
4. **Backend** — routers generate/analyze, GenerationLog, deps JWT, compose libreoffice, requirements
5. **Тестировщик** — pytest + guards.md на C-04…C-06 + regression-guards
6. **Фиксер** — до зелёного
7. **Деплоер** — uvicorn localhost (Docker LO — если доступен)
8. **Клиент** — приёмка

## Paths

| Роль | Paths |
|------|-------|
| Doc Engine | `backend/app/services/doc_engine/**`, `backend/tests/fixtures/docx/**`, `backend/tests/test_doc_engine*.py` |
| Template Analyzer | `backend/app/services/template_analyzer.py`, `backend/tests/test_template_analyzer.py` |
| Backend | `backend/app/api/routers/generate.py`, templates analyze, `docker-compose.yml`, `requirements.txt` |

Не трогать: PII schema, auth core (кроме deps), Frontend, VPS.
