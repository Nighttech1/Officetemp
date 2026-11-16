### [C-03] JWT/RBAC + S3-совместимое хранилище
- **Зона / Экран:** Backend / auth + storage (фаза 1.3–1.4)
- **Факт:** Нет аутентификации, ролей и безопасного хранения файлов шаблонов/документов.
- **Ожидание:** Регистрация/логин выдают JWT с `user_id`, `organization_id`, `role`; RBAC (owner/admin/member); эндпоинты выдачи presigned URL через S3 API (MinIO локально); секреты только в env.
- **Приоритет:** P0
- **Скрин-улика:** n/a; проверка — login → protected route; storage health
- **Зона:** Backend
