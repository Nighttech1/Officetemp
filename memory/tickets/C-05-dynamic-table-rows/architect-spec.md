# Architect Spec — W-02 Doc Engine

## Контекст

Фаза 2 roadmap поверх ядра W-01. Цель — генерация DOCX без ломки верстки, динамические таблицы, анализ тегов, PDF через LibreOffice.

## Тикеты

C-04 (flat render), C-05 (tr for), C-06 (analyzer + PDF)

## Границы

**В scope:** сервисы рендера/анализа/PDF, fixture-шаблоны, API generate/analyze, compose `libreoffice`  
**Вне scope:** Frontend mapper, Celery ZIP batch, Excel connectors, prod VPS

## Модули

```
backend/app/services/doc_engine/
  render.py          # DocxTemplate.render
  pdf_convert.py     # subprocess / HTTP to libreoffice sidecar
  __init__.py
backend/app/services/template_analyzer.py
backend/app/api/routers/generate.py
backend/app/api/routers/templates.py  # + analyze endpoint
backend/tests/fixtures/docx/
  flat_tags.docx
  dynamic_table.docx
  legal_spec_sample.docx
docker-compose.yml   # + libreoffice service
```

## API contracts

### `POST /api/v1/generate/docx` (JWT)
Request: multipart `template` file + form/JSON `context` **или** JSON `{ "storage_key": "...", "context": {} }`  
MVP: multipart template + `context` as JSON string field.  
Response: `application/vnd.openxmlformats-officedocument.wordprocessingml.document` file download.  
Side effect: `GenerationLog` row (status success/failed), scoped `organization_id`.

### `POST /api/v1/generate/pdf` (JWT)
Same input as docx OR accept already-rendered path; internal: render docx → convert PDF.  
Response: `application/pdf`.  
If LibreOffice unavailable: 503 with clear message (unit tests mock converter).

### `POST /api/v1/templates/analyze` (JWT)
multipart `.docx` →  
```json
{ "tags": [ { "name", "kind": "var"|"tr_for"|"for"|"if"|"other", "raw", "count" } ] }
```
Read-only; не менять файл. Склеивать разорванные runs в параграфе.

## Doc Engine rules

1. Только `docxtpl.DocxTemplate` — не пересобирать документ с нуля.
2. Таблицы: `{% tr for item in items %}` … `{% endfor %}`.
3. PDF: LibreOffice headless в отдельном контейнере; API вызывает CLI/sidecar, не in-process UNO.
4. Временные файлы в `backend/.runtime/tmp/{org_id}/` (gitignore).

## LibreOffice compose (ориентир)

```yaml
libreoffice:
  image: lscr.io/linuxserver/libreoffice:latest  # OR dedicated headless image
  # Prefer: custom Dockerfile with soffice --headless
```

Практичный MVP: сервис на базе `gotenberg/gotenberg` **запрещён как замена ТЗ** — ТЗ требует libreoffice-headless.  
Использовать образ с `soffice`, команда:
`soffice --headless --convert-to pdf --outdir <dir> <file.docx>`

Либо тонкий sidecar FastAPI/скрипт в контейнере, принимающий upload и возвращающий PDF.  
Env: `LIBREOFFICE_URL` или `LIBREOFFICE_BIN=soffice`.

## Зависимости

- `docxtpl`, `python-docx` в requirements.txt

## Инварианты

- Tenant: generation logs с `organization_id` из JWT
- Не логировать полный context с ПДн в plaintext (обрезать/хэшировать в GenerationLog.meta)
- Нет DROP миграций (GenerationLog уже есть)

## Chain

См. `chain.md`
