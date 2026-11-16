---
name: twentyfirst-mcp
description: >-
  Connect Client and Frontend to 21st.dev MCP catalog so agents can search,
  preview, and pull React/Tailwind components to replace plain UI on the Doc
  SaaS site. Use when the user/Client wants 21st.dev / Magic UI / Aceternity-
  style elements, says «возьми с 21st», «замени кнопку/hero/карточки из
  каталога», or when Landing/Frontend needs inspiration/code from 21st MCP.
---

# 21st.dev MCP — каталог компонентов для Клиента и Фронта

Официальный каталог: [21st.dev/mcp](https://21st.dev/mcp) · docs [help.21st.dev/ai/mcp](https://help.21st.dev/ai/mcp) · CLI `@21st-dev/cli`.

Раньше пакет назывался **Magic MCP** (`@21st-dev/magic`) — теперь единый endpoint `https://21st.dev/api/mcp`.

## Подключение (один раз) — два способа

Источники: [21st.dev/mcp](https://21st.dev/mcp) · [auth.md](https://21st.dev/auth.md)

### A) Вход аккаунтом (OAuth) — без ключа в `.env`
1. В `.cursor/mcp.json` сервер `21st` — **только** URL `https://21st.dev/api/mcp` (без headers).
2. Cursor: **Reload MCP**.
3. Cursor сам предложит войти на 21st → аккаунт → согласие.
4. Строка `API_KEY_21ST` не нужна.

### B) API-ключ (если OAuth недоступен / CI)
1. Создать ключ на https://21st.dev/mcp (вид `21st_sk_...`).
2. В `.env`: `API_KEY_21ST=21st_sk_...`
3. В mcp.json добавить:
   `"headers": { "x-api-key": "${API_KEY_21ST}" }`
   (MCP также принимает `Authorization: Bearer …`).

CLI (опционально — печатает конфиг, ключ сам не выдаёт):

```bash
npx @21st-dev/cli@latest init --client cursor
npx @21st-dev/cli@latest login   # сессия для CLI, не замена MCP
```

Проверка: tools `search`, `get_component`, `get_inspiration`, `search_logo`, `generate`, …

Сопутствующие skills (установлены в `.agents/skills/`):  
`21st-ui-explore`, `21st-ui-build`, `21st-ui-review`, `21st-cli-use`, `21st-ai`, `21st-registry`, `21st-design-sync`.

## Роль: Клиент (выбор, не код)

Клиент **не пишет** JSX. Он:

1. Смотрит localhost и говорит, что заменить («обычная кнопка CTA», «плоский hero», «серые карточки»).
2. Через MCP `search` / `get_inspiration` находит 2–4 кандидата на 21st (hero, button, bento, marquee, aurora…).
3. Фиксирует в тикете `C-*`:
   - **Зона:** какой блок на `/` или `/app`
   - **21st id / название** + ссылка
   - **Ожидание:** «встроить паттерн под DESIGN.md (teal, без purple)»
4. Передаёт Оркестратору. Приёмка — скрин after + сравнение с выбранным референсом (`image-compare` ок).

Формулировки Клиента:
- «Клиент: замени CTA на вариант с 21st search `shimmer button`»
- «Возьми aurora background с 21st вместо плоского фона»

## Роль: Frontend / Landing Promo (встройка)

1. Прочитать `frontend/DESIGN.md` (кабинет или § Marketing).
2. MCP: `get_component` / CLI `21st get` — код компонента.
3. **Адаптировать** под токены DocSaaS (brand teal, landing-grey/dark) — не тащить чужой purple/indigo.
4. Стек проекта: Next + GSAP/Lenis на лендинге; в кабинете допустим `motion` как сейчас. Не раздувать Framer+anime+Three без chain.
5. Скопировать паттерн **в репозиторий** (свой компонент). Runtime-зависимость от 21st CDN не нужна.
6. Mobile: `responsive-mobile-web` + touch; `prefers-reduced-motion`.
7. После встройки — Клиент смотрит Playwright 1440 + iPhone/Android.

## Жёсткие границы

- Платные retrieval/generate — только при наличии ключа; metadata `search` обычно бесплатен.
- Не публиковать чужие компоненты обратно в registry без запроса пользователя (`21st-registry` — осторожно).
- Не подменять весь лендинг «сборкой из 12 карточек 21st» — один signature-элемент за волну + presence gate (`landing-client-ready`).
- 152‑ФЗ / формы / оплаты — не из каталога UI; свои skills.

## Выход

`🧩 **21ST MCP:** [search query] · component id · adapted paths · DESIGN tokens ok`
