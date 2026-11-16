### [C-01] FastAPI + PostgreSQL + Docker Compose фундамент
- **Зона / Экран:** Backend / инфраструктура (фаза 1.1)
- **Факт:** В репозитории нет рабочего ядра API и локального Docker Compose — нельзя поднять защищённое окружение для разработки.
- **Ожидание:** Поднят `docker compose` с PostgreSQL (+ MinIO для S3), сервис FastAPI отвечает `GET /health`, есть `.env.example`, зависимости зафиксированы, OpenAPI доступен на localhost.
- **Приоритет:** P0
- **Скрин-улика:** n/a (API); проверка — HTTP 200 `/health` и `/docs`
- **Зона:** Backend | Deploy
