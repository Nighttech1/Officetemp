# Плагины — Doc Engine

| Name | Type | Where | When |
|------|------|-------|------|
| document-docx | skill (GitHub) | `.agents/skills/document-docx/` | python-docx / docxtpl / mammoth playbooks |
| doc-engine | skill | `.cursor/skills/doc-engine/` | рендер DOCX + LibreOffice PDF |
| celery-highload | skill | `.cursor/skills/celery-highload/` | пакетная генерация 1000+ |
| template-analyzer | skill | `.cursor/skills/template-analyzer/` | извлечение тегов |

## Docker (ориентир фазы 2–5)

- сервис `libreoffice-headless` отдельным контейнером
- шрифты заказчика — volume read-only
- api не держит LibreOffice in-process

Секреты S3/Yandex Object Storage — только `.env`.
