# Guards — C-05 dynamic table rows

## Executable
```bash
cd backend && pytest tests/test_doc_engine_tables.py -q
```
Expected: `{%tr for item in items %}` produces N data rows matching context length (python-docx row count).

## Regression class
Table row styles lost / wrong row count after render.
