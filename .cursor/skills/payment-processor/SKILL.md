---
name: payment-processor
description: >-
  Онлайн-оплаты и онлайн-касса (54-ФЗ): ЮKassa платежи/возвраты/webhooks +
  фискализация (ЮKassa receipts и/или АТОЛ Онлайн). Use when implementing
  subscriptions, checkout, refunds, or fiscal receipts.
---

# Payment Processor (оплата + онлайн-касса)

## Зона

Приём оплаты за SaaS (подписка / пакет генераций), webhooks, возвраты, **фискальные чеки 54-ФЗ**.

## Рекомендуемый стек РФ

| Слой | Инструмент |
|------|------------|
| Платежи | ЮKassa API (`yookassa` Python SDK) |
| Чеки | ЮKassa Receipts **или** АТОЛ Онлайн (`@theyahia/atol-online-mcp`) |
| Паттерны webhooks/idempotency | `.agents/skills/api-commerce-stripe` (адаптировать идеи: raw body, подпись, idempotency key) |
| Референс SDK | `plugins/payment-processor/stripe-python` (паттерны; прод — ЮKassa) |

## Жёсткие правила

1. Секреты (`YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`, ATOL login/password) — только `.env`, никогда в фронт и логи.
2. **Webhook = источник истины** о статусе платежа; всегда проверять подпись/аутентичность.
3. Каждый POST в ЮKassa — **Idempotence-Key** (UUID), чтобы не списать дважды.
4. Сумму и тариф считать **только на сервере**; клиент шлёт `plan_id`, не «amount».
5. Для чека: позиции, НДС, email/телефон покупателя — минимально; ПДн для чека согласовать с Personal-Data DB.
6. Не хранить полный номер карты / CVV (запрещено); только payment_method_id провайдера.
7. Тестовый и боевой магазины — разные ключи и разные MCP env.

## MCP (подключать при работе роли)

- `yookassa` — `@theyahia/yookassa-mcp` (платежи, refunds, receipts, webhooks)
- `atol-online` — `@theyahia/atol-online-mcp` (фискализация, если чеки не через ЮKassa)

Env-имена без значений — в `plugins/payment-processor/PLUGINS.md`.

## Связи

Backend (orders/subscriptions), Personal-Data DB (контакт для чека), Security/Hacker (второй цикл: webhook forgery, IDOR на invoices).

`💳 **PAYMENT PROCESSOR:** [платёж / чек 54-ФЗ / webhook]`
