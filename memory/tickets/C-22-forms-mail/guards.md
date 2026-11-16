# Guards — C-22 Forms + email

## Checks

1. `POST /api/v1/forms/contact` accepts JSON `{ name, email, message, website? }`.
2. Honeypot: non-empty `website` → **200** with `status: accepted`, **no** JSONL append.
3. Valid body without SMTP → **200** `status: stored`, line in `.runtime/forms/submissions.jsonl` (or `FORMS_RUNTIME_DIR`).
4. Invalid email / short message → **422**.
5. Frontend `/contact`: dark UI, FadeIn, GlassCard, honeypot field visually hidden; links from login/nav/footer.
6. Pytest: `tests/test_forms_contact.py` green.

## Automated

```bash
cd backend
.venv/Scripts/python.exe -m pytest -q tests/test_forms_contact.py
```
