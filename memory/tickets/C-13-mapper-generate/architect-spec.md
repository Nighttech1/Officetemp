# Architect Spec — W-04 Frontend Cabinet (Phase 4)

## Профиль Frontend
**A) Web SaaS** — Next.js (App Router) + TypeScript + Tailwind. Не Flutter. Не luxury landing — **рабочий кабинет B2B**.

## Product brand
Рабочее имя UI: **DocSaaS**.  
Визуал: светлый фон slate/ink, акцент **steel teal** `#0F766E`, шрифт **Source Sans 3** + display **Fraunces** только для логотипа.  
Запреты taste: не purple-gradient, не cream+terracotta broadsheet, не emoji-декор.

## Scope волны (≤3)
- C-11 Auth + profile
- C-12 Templates library  
- C-13 Mapper + Generate dashboard  

**Out of wave:** 4.5 Asset Pipeline (AVIF/blurhash) → следующая волна; Motion/WebGL не звать; Celery ZIP batch — фаза 5.

## App structure
```
frontend/
  package.json          # next 15, react 19, tailwind 4 or 3
  next.config.ts        # rewrite /api → BACKEND or env NEXT_PUBLIC_API_URL
  app/
    layout.tsx
    page.tsx            # redirect to /login or /app
    login/page.tsx
    register/page.tsx
    app/
      layout.tsx        # shell nav
      page.tsx          # profile / home
      templates/page.tsx
      mapper/page.tsx
      generate/page.tsx
  lib/api.ts            # fetch wrapper + JWT
  components/...
  DESIGN.md             # tokens
```

## API wiring (existing backend :8000)
| UI | Backend |
|----|---------|
| Register/Login/Me | `POST /api/v1/auth/register`, `/login`, `GET /me` |
| Templates list/create | `GET/POST /api/v1/templates` |
| Analyze docx | `POST /api/v1/templates/analyze` |
| Excel upload | `POST /api/v1/data/excel` |
| Generate | `POST /api/v1/generate/docx`, `/pdf` |

CORS: backend already allows localhost:3000 / 5173 — keep Next on **3000**.

## UX acceptance (Client language)
1. Новый пользователь регистрирует компанию и входит.
2. Загружает Word-шаблон, видит список тегов.
3. Загружает Excel, сопоставляет колонки с тегами выпадающими списками.
4. Жмёт «Сгенерировать DOCX/PDF» и скачивает файл.
5. На телефоне (~390) нет горизонтального скролла страницы; CTA доступны пальцем.

## Chain
Архитектор → **Frontend** → Тестировщик → Фиксер → Деплоер (next + api) → Клиент

## Skills
`baseline-ui`, `responsive-mobile-web`, `next-dev-loop` (если доступен), taste-skill запреты.
