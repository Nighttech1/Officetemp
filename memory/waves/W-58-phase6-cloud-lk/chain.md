# W-58 chain

Порядок (не параллелить overlapping paths):

1. **Архитектор** — spec (этот каталог) ✅
2. **Backend** — C-601 Postgres-only + Alembic smoke + runbook
3. **Personal-Data DB** + **Backend** — C-602 profile/export/erase/TTL
4. **Backend** — C-603 snapshot revision + storage download API + template blob paths
5. **Frontend** — C-603 continuous sync + presign upload Word + restore on login
6. **DevOps** — черновик `docs/VPS_READINESS.md` (без SSH)
7. **Тестировщик** — pytest + smoke Postgres + E2E критерий файлов + guards
8. **Фиксер** — до зелёного
9. **Деплоер** — только localhost (compose up api/db/redis/minio)
10. **Клиент** — приёмка надёжности хранения

VPS Deployer — **запрещён** до явного «да» Клиента.
