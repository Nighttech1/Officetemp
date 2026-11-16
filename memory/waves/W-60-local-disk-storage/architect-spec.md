# W-60 — Файлы на диске VPS (без платного Object Storage)

## Решение Клиента
Хранение бинарников Word/Excel — **отдельный контур на том же VPS** (Docker volume / каталог), не Yandex Object Storage и не обязательный MinIO.

## Инварианты
1. `STORAGE_BACKEND=local` — prod-default; S3/MinIO только если явно `STORAGE_BACKEND=s3`.
2. Ключи всегда `org/{organization_id}/…`; чужой org → 403.
3. Postgres: метаданные ЛК/проектов/папок/документов; диск: только байты по ключу.
4. Том `docsaas_blobs` (или bind `/var/lib/docsaas/blobs`) бэкапится вместе с Postgres.
5. MinIO в compose — **optional profile**, не блокер деплоя.

## Тикет
| ID | P | Acceptance |
|----|---|------------|
| C-604 | P0 | local default; compose volume; isolation smoke 2 orgs; roadmap/VPS updated |

## Когда финализировать VPS
После зелёного C-604 + 6.3.6 E2E-guard (или API-эквивалент «второй клиент видит файл») + чеклист 6.4 без платного S3 + явное «да» Клиента.
