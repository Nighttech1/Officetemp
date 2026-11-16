# Chain — W-05 (C-15, C-16, C-17)

1. Архитектор — spec
2. **Backend** — models/jobs API, celery app, tasks (generate + zip + cleanup), requirements celery[redis], redis
3. **Doc Engine** — только вызов существующих render/pdf из tasks (не переписывать dxpdf)
4. **Deployer** — docker-compose redis + worker (+ beat); .env.example
5. Тестировщик — eager celery tests + guards
6. Фиксер → Клиент

Paths: `backend/app/worker/**`, `backend/app/api/routers/jobs.py`, `backend/app/models/job.py`, `docker-compose.yml`, `backend/tests/test_jobs*.py`

Не трогать: PII wipe, Frontend rewrite (optional poll only), VPS prod, Payment.
