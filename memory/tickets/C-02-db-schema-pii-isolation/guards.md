# Guards — C-02 DB schema + PII isolation

## Executable
```bash
cd backend && pytest tests/test_pii.py tests/test_templates.py -q
```
Expected:
- `User` mapper has no `email` / `phone` / `full_name` columns
- Two orgs: templates of A invisible to B (tenant isolation)

## Schema contract
- PII lives in schema `pii` (`UserProfile`, `AccessAudit`) via `PiiService`
- App tables: organizations, users, templates, generation_logs with `organization_id`

## Regression class
Cross-tenant leak + PII column bleed into public User model.
