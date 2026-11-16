### [C-06] Анализатор тегов + мост DOCX→PDF
- **Зона / Экран:** Template Analyzer + Doc Engine PDF (фаза 2.3–2.4)
- **Факт:** Нельзя получить список тегов из `.docx` для будущего маппинга; нет конвертации в PDF через LibreOffice.
- **Ожидание:** `POST /api/v1/templates/analyze` → JSON тегов (var / tr_for / for / if); сервис `libreoffice` в compose + `POST /api/v1/generate/pdf` (или convert после docx); без LibreOffice тесты мокают subprocess; API не держит LO in-process.
- **Приоритет:** P0
- **Скрин-улика:** n/a; проверка — pytest analyze + mock PDF convert
- **Зона:** Template Analyzer | Doc Engine | Backend | Deploy
