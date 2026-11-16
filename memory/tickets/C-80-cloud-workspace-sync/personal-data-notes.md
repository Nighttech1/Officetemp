# Personal-Data DB — W-35 cloud workspace

## Классификация

| Поле | Контур | Примечание |
|------|--------|------------|
| email, full_name, phone, consent_at | `pii.user_profiles` | только через PiiService + audit |
| password_hash | `users` (public) | не ПДн в сыром виде; bcrypt/argon |
| organization.name | public | B2B, не ПДн физлица |
| workspace_* (проекты, папки, JSON мастера) | public + org_id | бизнес-данные; фамилии в iul_wizard.signatures — минимизировать, не логировать |
| signature image bytes | object storage `org/{id}/signatures/` | доступ только своей org; в Postgres только storage_key |
| исходный PDF ИУЛ | **не хранить** | только имя/хэш/мета в JSON |

## Consent (C-82)

- Регистрация: `consent: true` обязателен; без галочки — 400.
- `consent_at = now()` при create_profile.
- Email verification: **не требуется** 152-ФЗ для MVP.

## Удаление / выгрузка (минимум в следующей подволне)

- DELETE аккаунта: cascade org → workspace + pii profile (отдельный endpoint).
- Export: JSON snapshot без password_hash.

## Dual-write LS

Копия на устройстве субъекта допустима. После logout — опциональная очистка (продуктовое решение, не блокер DDL).

`🗄️ **PERSONAL-DATA DB:** классификация + consent обязателен; PDF ИУЛ вне облака`
