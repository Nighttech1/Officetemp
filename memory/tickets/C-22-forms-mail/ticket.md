### [C-22] Формы + email
- **Зона:** Backend / Forms-mail (фаза 5.8)
- **Факт:** Нет публичной формы заявки и отправки писем.
- **Ожидание:** `POST /api/v1/forms/contact` — honeypot, rate limit простой, валидация, лог в таблицу/файл; email через SMTP env (если нет SMTP — сохранить заявку + лог «queued»); фронт страница `/contact` или блок в кабинете; безопасный optional file upload (mime/size).
- **Приоритет:** P0
- **Статус:** done
- **Зона:** Backend | Forms-mail | Frontend
