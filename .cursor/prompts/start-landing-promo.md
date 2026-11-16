# Старт: рекламный лендинг Doc SaaS

Пользовательская команда (синонимы): «делаем лендинг», «рекламная страница», «landing promo», «витрина сервиса».

С референсом: «вот ссылка … адаптируй», «сделай как у …», кинул скрин → skill `reference-landing-adapt`.

## Цикл

Архитектор → Landing Promo + Frontend (A) → Motion → Asset Pipeline → Тестировщик → Фиксер → Деплоер → Клиент

При референсе: Архитектор сначала фиксирует URL/image в chain + keep/drop; Frontend дергает MCP `design-clone` / `source-first-clone` + Playwright.

## Обязательное чтение

1. `.cursor/skills/landing-promo/SKILL.md`
2. `.cursor/skills/reference-landing-adapt/SKILL.md` (если есть референс)
3. `.cursor/rules/landing.mdc`
4. `.agents/skills/LANDING_SKILLS_SOURCES.md`
5. `plugins/design-clone-mcp/PLUGINS.md`
6. `frontend/DESIGN.md`, `architecture.md`
7. Сейчас `/` только редиректит на login — заменить маркетинговой витриной, кабинет оставить на `/app`

## Signature (Архитектор выбирает одно в chain.md)

- `gsap-choreography` — live demo маппинга тегов (рекомендуется без готового ролика)
- `scroll-scrub-video` — если есть/будет короткий MP4 процесса
- `cinematic-scrub-landing` — mouse-scrub cinematic
- `remotion-best-practices` — сначала снять петлю, потом встроить
- из референса — если пользователь дал URL/скрин (rhythm/композиция оттуда)

## Gate

- Desktop 1440 + playwright-iphone + playwright-android
- `anti_slop_scan`, Lighthouse, reduced-motion fallback
- при референсе: `image-compare` (композиция, не пиратство бренда)
- Клиент: вердикт; без P0/P1
- MCP: после добавления `design-clone` / `source-first-clone` — reload MCP в Cursor
