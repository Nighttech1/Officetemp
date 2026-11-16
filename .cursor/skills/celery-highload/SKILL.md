---
name: celery-highload
description: >-
  Celery + Redis очереди для пакетной генерации документов (1000+ PDF), ZIP,
  ретраи, идемпотентность. Use when implementing or debugging async generation jobs.
---

# Celery High-load (Doc SaaS)

## Когда

Фаза 5 roadmap: сотни/тысячи документов, прогресс в UI, ZIP-архив.

## Паттерн

1. FastAPI принимает job → пишет `GenerationLogs` (queued) → `task.delay(job_id)`.
2. Worker: chunk по N строк → Doc Engine → артефакты в S3/Yandex Object Storage.
3. Финальный task: ZIP → signed URL → статус `done`.
4. UI поллит `/jobs/{id}` или SSE/WebSocket.

## Правила

1. Задачи **идемпотентны** по `job_id` + `row_id` (повторный run не плодит дубликаты файлов).
2. Broker/result: Redis; не хранить ПДн в result backend дольше TTL.
3. Hard time limits + soft limits; при падении LibreOffice — retry с backoff, не бесконечно.
4. Параллелизм воркеров ограничен CPU LibreOffice (обычно 1 PDF-конверт на процесс).
5. Автоочистка артефактов через 24ч — отдельный beat-task (комплаенс).

## Связи

Doc Engine, Backend, Deployer (Docker: api + worker + redis + libreoffice).
