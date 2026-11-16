# Хранение файлов клиентов (Word / Excel)

## Решение для MVP / первого VPS

Файлы лежат **на том же VPS**, в отдельном каталоге (контур), не в платном облаке.

| Что | Где |
|-----|-----|
| Кабинеты, проекты, папки, карточки, ключи файлов | PostgreSQL |
| Байты Word/Excel | Диск: `LOCAL_BLOB_ROOT` → по умолчанию `backend/.runtime/blobs` или том `/app/.runtime/blobs` |
| PDF исходники ИУЛ | **Не храним** на сервере |

Ключ объекта всегда: `org/{organization_id}/docs/…` или `org/{organization_id}/templates/…`.  
Чужой `organization_id` в ключе → HTTP 403.

## Настройки

```env
STORAGE_BACKEND=local
LOCAL_BLOB_ROOT=/app/.runtime/blobs
```

Опционально позже: `STORAGE_BACKEND=s3` + MinIO/Yandex на том же или внешнем контуре.

## Изоляция

- Workspace snapshot — только своя `organization_id`
- Download/upload — проверка `org_owns_key`
- Два разных ЛК не видят проекты и файлы друг друга
