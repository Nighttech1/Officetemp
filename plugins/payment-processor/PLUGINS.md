# Плагины — Payment Processor

| Name | Type | Where | When |
|------|------|-------|------|
| payment-processor | skill | `.cursor/skills/payment-processor/` | ЮKassa + 54-ФЗ |
| api-commerce-stripe | skill (GitHub) | `.agents/skills/api-commerce-stripe/` | паттерны webhook/idempotency |
| stripe-python | SDK ref | `plugins/payment-processor/stripe-python/` | референс паттернов SDK |
| yookassa MCP | MCP | `@theyahia/yookassa-mcp` | платежи/чеки/webhooks |
| atol-online MCP | MCP | `@theyahia/atol-online-mcp` | онлайн-касса АТОЛ |

## Env (имена без секретов)

```
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=
ATOL_LOGIN=
ATOL_PASSWORD=
ATOL_GROUP_CODE=
ATOL_COMPANY_INN=
ATOL_PAYMENT_ADDRESS=
```

Секреты только в `.env`, не коммитить.
