# C-59 — Internal Server Error при скачивании DOCX/PDF (кириллическое имя файла)

**Priority:** P0 · **Wave:** W-26 · **Status:** done

### Cause (runtime)
`Content-Disposition: filename="Накладная….docx"` → Starlette `UnicodeEncodeError` latin-1 → HTTP 500.

### Fix
`_content_disposition()`: ASCII fallback + `filename*=UTF-8''…`
