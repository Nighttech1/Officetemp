# Guard C-59 / C-60 (W-26)

## C-59 Internal Server Error
- Cause: Cyrillic `Content-Disposition` filename → latin-1 UnicodeEncodeError
- Fix: `_content_disposition()` ASCII + `filename*=UTF-8''…`
- Status: **done** (user confirmed downloads work)

## C-60 One table row instead of N
- Cause: template body `{{number}}/{{name}}/{{code}}` without `{%tr for%}`; preview faked N rows
- Fix: FE `items[]` + BE `ensure_table_row_loops`
- Status: **done** (user: «Всё получилось»)

Debug instrumentation removed 2026-09-23.
