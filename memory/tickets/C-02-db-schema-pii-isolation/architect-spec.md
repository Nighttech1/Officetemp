# Architect Spec — C-02 DB + PII

См. общий spec: `../C-01-fastapi-docker-foundation/architect-spec.md` § Контракты данных.

Дополнительно:
- Alembic revision создаёт schema `pii` и таблицы `user_profiles`, `access_audit`
- Индексы: `templates(organization_id)`, `generation_logs(organization_id)`, `user_profiles(email)`
- Optional: `SET LOCAL app.current_org_id` + RLS policies (если время; минимум — application-level filter + тесты)
