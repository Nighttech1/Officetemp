# DocSaaS Frontend (Phase 4)

Кабинет пользователя: вход, шаблоны Word, маппинг Excel → теги, генерация DOCX/PDF.

## Требования

- Node.js 20+
- Backend API на `http://127.0.0.1:8000` (CORS уже разрешает `localhost:3000`)

## Запуск

```bash
cd frontend
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

Переменная окружения (опционально):

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## Сборка

```bash
npm run build
npm start
```

## Маршруты

| Путь | Назначение |
|------|------------|
| `/` | Редирект на `/login` или `/app` |
| `/login` | Вход |
| `/register` | Регистрация компании |
| `/app` | Профиль (`GET /auth/me`) |
| `/app/templates` | Библиотека шаблонов |
| `/app/mapper` | Excel + теги, связи |
| `/app/generate` | DOCX / PDF |

JWT хранится в `localStorage` (MVP). Без токена `/app/*` уводит на `/login`.
