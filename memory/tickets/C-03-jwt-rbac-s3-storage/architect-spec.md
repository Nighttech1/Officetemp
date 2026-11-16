# Architect Spec — C-03 JWT/RBAC + S3

См. общий spec: `../C-01-fastapi-docker-foundation/architect-spec.md` § Auth / Storage.

Дополнительно:
- Passwords: bcrypt via passlib (или pwdlib)
- Role hierarchy: owner > admin > member; удаление org — только owner (stub OK)
- Storage: если MinIO недоступен в unit-тестах — mock; integration-тест с compose — желателен
