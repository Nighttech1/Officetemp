# C-60 — В Word одна строка таблицы вместо выбранных N (например 6)

**Priority:** P0 · **Wave:** W-26 · **Status:** done

### Cause
Шаблон накладной: одна строка `{{number}}/{{name}}/{{code}}` без `{%tr for%}`.
Превью рисовало N строк само; docxtpl заполнял только одну.

### Fix
- FE: `items[]` из стыковки × выбранный диапазон
- BE: `ensure_table_row_loops` — авто `{%tr for item in items%}` … `{%tr endfor%}`
