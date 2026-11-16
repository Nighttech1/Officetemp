# C-36 architect

Landing nav links mirror AppNav:
- /app Профиль
- /app/templates Шаблоны
- /app/mapper Маппинг
- /app/generate Генерация
- /contact Контакты

Right CTA: «Личный кабинет» → /login (not /app, so unauthenticated users land on login).

Chain: Frontend → Тестировщик → Деплоер → Клиент
Paths: `frontend/components/landing/LandingNav.tsx`
