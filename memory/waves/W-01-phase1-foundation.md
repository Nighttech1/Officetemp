# Волна W-01 — итог

**Статус:** закрыта (localhost API без Docker Desktop)

| Тикет | Guard | Результат |
|-------|-------|-----------|
| C-01 | `guards.md` + `test_health` | `/health` ok, OpenAPI `/docs` |
| C-02 | `guards.md` + `test_pii` + `test_templates` | изоляция тенантов, User без PII-колонок |
| C-03 | `guards.md` + `test_auth` + `test_storage` | JWT register/login/me, presign key `org/{org_id}/templates/…` |

**Замечание среды:** на рабочей станции нет `docker` в PATH — стек поднят через uvicorn + SQLite (`docsaas_local.db`). `docker-compose.yml` готов к запуску после установки Docker Desktop. MinIO не поднят; presign генерируется локально (ensure_bucket с коротким timeout).
