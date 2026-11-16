# W-64 — Маркетинговые рассылки (баннеры / предложения)

## Вердикт аудита
**Не учтено.** Есть только SMTP для контактной формы и сброса пароля.  
Нет: отдельного согласия на рекламу, кампаний, HTML-писем, очереди рассылки, отписки.

## Acceptance
1. Согласие на маркетинг **отдельно** от согласия на обработку ПДн (`marketing_opt_in_at`).
2. Без opt-in письма с баннерами/офферами **не** отправляются.
3. В каждом письме — ссылка отписки; `POST/GET` отписки без логина.
4. Кампания: subject + HTML (+ text fallback) → Celery → доставки только opted-in.
5. Создавать/запускать кампании может `owner` при `MARKETING_CAMPAIGNS_ENABLED=true` (platform broadcast MVP).
6. Аудит ПДн: `marketing.opt_in` / `marketing.opt_out` / `marketing.unsub`.
7. Privacy + регистрация (галочка) + страница `/unsubscribe`.

## Вне scope
- Визуальный конструктор баннеров, A/B, сегменты по орг.
- Провайдеры вроде Unisender (позже через тот же сервис).
- VPS SSH.

## Данные
| Сущность | Где | Заметка |
|----------|-----|---------|
| `marketing_opt_in_at`, `marketing_unsub_token_hash` | `pii.user_profiles` | через PiiService |
| `email_campaigns` | public | контент без email |
| `email_campaign_deliveries` | public | user_id + status, без raw email |

## API
- `PATCH /api/v1/profile/me` + поле `marketing_opt_in: bool`
- `POST /api/v1/marketing/unsubscribe` `{token}` (public)
- `POST /api/v1/marketing/campaigns` → queue Celery
- `GET /api/v1/marketing/campaigns/{id}`

## Chain
Архитектор → Backend → Frontend → Tester → Deployer → Client
