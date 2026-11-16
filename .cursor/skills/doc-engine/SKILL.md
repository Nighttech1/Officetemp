---
name: doc-engine
description: >-
  Ядро генерации DOCX/PDF: docxtpl (Jinja2), динамические таблицы {% tr for %},
  LibreOffice headless → PDF, сохранение стилей. Use when building or fixing
  document generation, template rendering, or PDF conversion.
---

# Doc Engine

## Когда включать

Фаза 2 roadmap (Doc Engine), тикеты про шаблоны Word, mail-merge, PDF, «сломалась вёрстка».

## Стек

| Задача | Инструмент |
|--------|------------|
| Подстановка тегов в `.docx` | `docxtpl` + Jinja2 |
| Динамические строки таблиц | `{% tr for item in items %}` |
| Конвертация DOCX→PDF | `libreoffice --headless` в Docker |
| Разбор тегов шаблона | Template Analyzer skill |
| Готовый playbook DOCX | `.agents/skills/document-docx` (если установлен) |

## Жёсткие правила

1. **Не ломать стили:** не пересобирать документ с нуля через `python-docx`, если шаблон уже в Word. Рендер через `DocxTemplate.render(context)`.
2. **Таблицы:** циклы только через `tr`/`tc`-теги docxtpl, чтобы копировался XML-узел строки (`w:tr`) со стилями.
3. **PDF:** только LibreOffice headless в изолированном контейнере; корпоративные шрифты монтировать в контейнер.
4. **Тесты:** unit-тесты с реальными юридическими/учебными шаблонами (нумерация, отступы, merged cells).
5. **Изоляция tenant:** файлы шаблонов и артефакты — scoped по `organization_id`; временные файлы чистить по политике (24ч на фазе 5).

## Live-preview в кабинете (docx-preview)

1. Шаблон должен **вписываться по ширине** окна (fit-width / `transform: scale`); горизонтальное обрезание = REJECT.
2. Обязательны zoom (+/−), fit и pan — вертикальная панель сбоку окна превью.
3. **Колонтитулы** (`renderHeaders` / `renderFooters`) должны быть видимы в DOM и не обрезаны `overflow:hidden` без pan. Пустой header/footer при наличии в Word = P0.
4. **Картинка в header (`wp:anchor`):** docx-preview кладёт floating-image в обёртку `width:0;height:0`. Guard: `naturalWidth≥100` и `offsetWidth≥50`. **Нельзя** переводить floating в `position:static` / `display:block` с `min-height` на header — это добавляет пустые строки сверху и раздувает межблочные интервалы vs Word. Держать absolute/размер EMU внутри 0×0 wrapper; `overflow:visible` на section/header.
5. **1:1 верстка:** не затирать `font-family` документа глобальным UI-шрифтом; не добавлять margin/padding на `header`/`p` внутри `.docx-waybill-preview` сверх того, что задал docx-preview.
6. **Pan:** clamp без slack; в pan-режиме `user-select:none` + `preventDefault` на pointerdown — запрет выделения текста. Viewport не должен обрезать края листа серой рамкой (`overflow`/`width` по scrollWidth контента).

## Минимальный поток

```
docx template + JSON context
  → DocxTemplate.render()
  → filled.docx
  → libreoffice --headless --convert-to pdf
  → filled.pdf (+ optional ZIP batch via Celery)
```

## Выход агента

`📄 **DOC ENGINE:** [что сгенерировано / как проверить / риски вёрстки]`
