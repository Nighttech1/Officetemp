# Guards — C-04 docxtpl flat render

## Executable
```bash
cd backend && pytest tests/test_doc_engine_flat.py tests/test_generate_api.py -q
```
Expected: `{{ ClientName }}` replaced; `POST /api/v1/generate/docx` returns filled DOCX with JWT.

## Regression class
Broken mail-merge / styles rebuilt from scratch instead of docxtpl.
