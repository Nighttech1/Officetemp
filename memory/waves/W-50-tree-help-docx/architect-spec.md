# W-50 — дерево отступ, help шаблона, DOCX сверху

## Тикеты
- **C-117** P1 — TreeView: правый край выделения не впритык к сайдбару (`mr` / calculated width); лёгкий вертикальный зазор между строками
- **C-118** P1 — WaybillTemplateHelp: простой текст (шапка + 1 строка `{{поле}}`; авто-размножение строк). Убрать обязательность `{%tr for%}` для обычного пользователя
- **C-119** P1 — модалка help через `createPortal(document.body)` + высокий z-index, чтобы не перекрывала вкладки из-за transform родителя
- **C-120** P1 — WaybillWizard: кнопка «Сформировать DOCX» справа от SlideTabs на всех шагах (как «Сформировать PDF» в ИУЛ)

## Chain
Frontend → Tester → Fixer → Deployer → Client
