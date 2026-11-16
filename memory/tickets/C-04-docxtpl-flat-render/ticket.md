### [C-04] Базовый рендер DOCX через docxtpl (плоские теги)
- **Зона / Экран:** Doc Engine (фаза 2.1)
- **Факт:** Нет сервиса подстановки `{{ ClientName }}` и аналогов в Word-шаблон без ломки стилей.
- **Ожидание:** `DocxTemplate.render(context)` заполняет плоские теги; API `POST /api/v1/generate/docx` принимает шаблон+JSON и возвращает заполненный `.docx`; стили параграфов сохраняются; tenant из JWT.
- **Приоритет:** P0
- **Скрин-улика:** n/a; проверка — pytest на fixture `.docx`
- **Зона:** Doc Engine | Backend
