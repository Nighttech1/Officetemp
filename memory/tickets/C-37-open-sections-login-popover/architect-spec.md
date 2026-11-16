# C-37 architect

1. `AuthGate` — временно pass-through (не redirect на /login). Комментарий «временно».
2. `LandingNav` — убрать Профиль; ссылки Шаблоны/Маппинг/Генерация/Контакты.
3. `LoginPopover` на кнопке «Личный кабинет»: desktop hover (delay ~120ms open / 200ms close), soft opacity/scale; mobile click toggle. Submit → login API → setToken → router.push('/app/templates') or stay.
4. AppNav: убрать «Профиль» тоже для единообразия шапки разделов.

Chain: Frontend → Тестировщик → Деплоер → Клиент
