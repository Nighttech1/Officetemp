# C-27 / C-28 / C-29 — Architect spec: DocSaaS landing (studiors adapt)

## Goal

Публичная витрина DocSaaS на `/` в композиции [studiors.be](https://studiors.be/), без редиректа на login. Кабинет остаётся на `/app/*`.

## Design read

Agency/portfolio editorial landing → Doc SaaS B2B promo.  
Dials: VARIANCE 8 / MOTION 7 / DENSITY 3.  
Palette: reference dark `#0E0E0D` + cream `#ECE9E2` + our teal `#2DD4BF` for CTAs.  
Type: Syne (grotesk hero) + Fraunces (serif accent) + Source Sans 3 (UI).

## Signature

Parallax editorial + marquee + scroll process cards (не WebGL в этой волне).

## Sections (map)

| # | Ref | Ours |
|---|-----|------|
| 0 | preloader | optional light fade-in (не копировать % counter) |
| 1 | nav | DocSaaS · Возможности · Метод · Контакт · Войти · CTA Регистрация |
| 2 | hero | DOC / SaaS или ДОКУМЕНТЫ / без срыва · desc · index 01–03 якоря |
| 3 | manifesto | боль «Formatting Breaks» → решение docxtpl |
| 4 | strip | 4–5 feature cards (шаблон / маппинг / очередь / ZIP / 152-ФЗ) — CSS/gradient placeholders, не чужие video |
| 5 | process | 01 Загрузить → 02 Связать → 03 Сгенерировать → 04 Скачать |
| 6 | services | capabilities list |
| 7 | contact | короткий lead + link `/contact` + email CTA |
| 8 | footer | ссылки login/register/legal |

## Non-goals

- Не пиратить ассеты studiors.
- Не Three.js/WebGL в W-11.
- Не менять API/кабинет кроме ссылок.
- Backend не трогаем.

## Acceptance (Client language)

1. Открыл localhost `/` — сразу красивая витрина, не форма входа.
2. Desktop 1440: читается как studio-лендинг, бренд DocSaaS в hero.
3. Mobile 390: одна колонка, скролл пальцем, CTA доступны.
4. Кнопки ведут в регистрацию/вход/контакт.

## Paths

- `frontend/app/page.tsx`
- `frontend/components/landing/**`
- `frontend/app/globals.css` (landing tokens)
- `frontend/DESIGN.md` — добавить секцию Marketing (не ломая cabinet tokens)
- `frontend/package.json` — gsap (+ @gsap/react optional), lenis
