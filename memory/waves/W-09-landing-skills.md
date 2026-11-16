# W-09 — усиление команды под рекламный лендинг

**Статус:** skills + clone MCP установлены; код лендинга ещё не писали.  
**Цель следующего хода:** крутая promo-страница сервиса (видео + анимация), опционально с референсом URL/скрин.

## Что сделано

- Подключены GitHub skills (GSAP official, choreography, frontend-design, impeccable, awwwards, cinematic/parallax/video, remotion, vignette)
- Добавлены team skills: `landing-promo`, `scroll-scrub-video`, **`reference-landing-adapt`**
- Роль: `.cursor/rules/landing.mdc`
- Реестр / Frontend / Motion / plugins обновлены
- Промпт старта: `.cursor/prompts/start-landing-promo.md`
- **MCP `design-clone`** — локально `plugins/design-clone-mcp` (GitHub wplaunchify)
- **MCP `source-first-clone`** — `npx web-embedding@latest mcp`
- Skills: `exact-clone-airfare`, `web-clone`

## Как кинуть референс

В чат: `Вот референс: https://… — сделай наш лендинг в этом духе`  
или прикрепить скриншоты.

После правки mcp.json — **Reload MCP / Reload Window** в Cursor.

## Следующий ход (команда пользователю)

«Делаем рекламный лендинг» / «приступаем к лендингу» (+ ссылка/скрин по желанию)

Chain: Архитектор → Landing+Frontend → Motion → Asset Pipeline → Тест → Фикс → Деплой localhost → Клиент
