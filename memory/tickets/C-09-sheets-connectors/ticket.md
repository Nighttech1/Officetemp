### [C-09] Коннекторы Google Sheets + Яндекс Таблицы
- **Зона:** Google Sheets / Yandex Sheets (фаза 3.2–3.3)
- **Факт:** Нет чтения облачных таблиц.
- **Ожидание:** Адаптеры `fetch_google_sheet` / `fetch_yandex_sheet`; секреты только env; без живых ключей — mock/httpx stubs в тестах; API endpoints с credential refs; read-only scopes.
- **Приоритет:** P0
- **Зона:** Google Sheets | Yandex Sheets | Backend
