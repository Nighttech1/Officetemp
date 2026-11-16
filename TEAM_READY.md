# Команда полностью готова к разработке

Дата: 2026-09-22. Продукт: Doc SaaS (`architecture.md`, `roadmap.md`).

## Основной цикл — кто есть

Оркестратор, Архитектор, Backend, **Personal-Data DB** (ПДн / 152-ФЗ), **Payment Processor** (ЮKassa + онлайн-касса), Doc Engine и коннекторы таблиц, Frontend, Тестировщик, Фиксер, Деплоер, Клиент.

## Второй цикл — по вашей команде

Фраза: **«запускаем второй цикл безопасности»**  
Роли: Security + Hacker (после MVP / по вашему сигналу). Подробности: `SECOND_SECURITY_CYCLE.md`.

## Что добавлено сейчас

| Агент | Skills / plugins / MCP |
|-------|-------------------------|
| Personal-Data DB | skill + rule; alembic, fastapi-users, postgres best practices |
| Payment Processor | skill + rule; stripe-паттерны; MCP **yookassa**, **atol-online** |
| Security | audit (oktsec), OWASP api/code/web/sca/secrets; dependency-check, semgrep |
| Hacker | ZAP, sqlmap, metasploit (стенд); skill второго цикла |

## Старт

Можно начинать с фазы 1. Напишите: **«приступаем к фазе 1 разработки»**.
