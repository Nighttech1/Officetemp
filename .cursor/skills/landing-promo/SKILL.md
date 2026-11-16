---
name: landing-promo
description: >-
  Orchestrates a premium marketing landing page for the Doc SaaS product
  (DOCX/PDF generation, Excel/Google/Yandex connectors, 152-ФЗ). Use when
  building or upgrading the public promo/landing page with video, GSAP
  animation, scroll cinema, or product walkthrough. Routes Frontend + Motion
  + Asset Pipeline + Client review; not for the authenticated /app cabinet.
---

# Landing Promo — Doc SaaS

Рекламная витрина продукта, не кабинет. Стек проекта: **Next.js + GSAP + Lenis** (не тащи Framer Motion + anime.js «потому что awwwards так сказал», если chain не требует).

## Продукт (якорь смысла)

- **Что:** потоковая генерация DOCX/PDF из шаблонов Word + данные из Excel / Google Sheets / Яндекс Таблиц.
- **Боль:** верстка договоров не ломается; 1000+ сертификатов через очередь; 152-ФЗ.
- **Не продавать:** «ещё один AI-чат». Продавать **результат на бумаге/в PDF** и скорость пакета.

## Референс «как у них»

Если пользователь дал URL или скрин понравившегося лендинга — сначала `.cursor/skills/reference-landing-adapt/SKILL.md`  
MCP: `design-clone` (`clone_website_design`) + `source-first-clone` + Playwright + `image-compare`.  
Собирающиеся фигурки (editable): `.cursor/skills/assembly-figures/SKILL.md` + конфиг `frontend/content/assembly-figures.json`.  
Потом этот pipeline с signature ниже.

Один запоминающийся signature-элемент на первом экране (выбрать **одно**):

| Signature | Skill |
|-----------|--------|
| Скриптовый walkthrough продукта (курсор кликает маппинг тегов) | `gsap-choreography`, `vignette` |
| Scroll-scrub видео процесса | `scroll-scrub-video` (+ ffmpeg) |
| Mouse-scrub cinematic hero | `cinematic-scrub-landing` |
| Remotion-петля → MP4 в hero | `remotion-best-practices` → `asset-pipeline` |
| Parallax-главы без видео | `parallax-landing-page` |

## Pipeline (обязательный порядок)

0. **Client-ready gate** — `.cursor/skills/landing-client-ready/SKILL.md`  
   Dials для Dayos-class / «скинуть заказчику»: variance **7** / motion **7** / density **6–7**  
   (не gallery density 3–4 из taste-skill baseline).
1. **Brief** — аудитория (юр/HR/edu/event), тон, одно обещание, CTA (`/register` или `/contact`).
2. **Дизайн-система** — `frontend/DESIGN.md` § **Marketing** (не кабинет); при смене языка → `create-design-md`. Анти-slop: `taste-skill`, `frontend-design`, `impeccable`.
3. **Композиция** — `luxury-web-craft` + `frontend-design` + при элите `awwwards-landing` (стек → GSAP). Hero = **presence**, не островок в пустоте.
4. **Motion thesis** — одна lens: restraint | polish | play. Реализация: `web-motion-engine` + официальные `gsap-*` + `emil-animate`.
5. **Видео/ассеты** — `asset-pipeline` (poster, AVIF/WebP, blurhash). Стили → HF MCP только как черновик кадра; финал через pipeline.
6. **Адаптив** — `responsive-mobile-web` + `mobile-touch-scroll` (iPhone/Android пальцем).
7. **Проверка** — `web-visual-critic` + **`checklist-landing-presence.md`**, Playwright ×3, Lighthouse, `anti_slop_scan`. Приёмка — **Клиент**.

## Presence (жёстко)

- Full-bleed первый экран; signature ≥ ~40% ширины desktop hero.
- Headline доминирует; CTA без скролла.
- Атмосфера плоскости (зерно / мягкий градиент / сцена) — не голый flat grey.
- REJECT: «маленький блок по центру серого океана» = не client-ready.

## Chain по умолчанию

```
Архитектор → Frontend → Motion → Asset Pipeline → Тестировщик → Фиксер → Деплоер → Клиент
```

WebGL (`three-webgl-craft`) — только если Архитектор явно включил в `chain.md`. Backend не нужен, пока лендинг статичен + формы (`forms-mail`).

## Структура страницы (ориентир)

1. Hero: бренд + одно обещание + CTA + **signature** (видео/film/scrub)
2. Боль → решение (1 колонка мысли, не сетка из 6 одинаковых карточек)
3. Как работает (3 шага: шаблон → данные → ZIP/PDF) — можно vignette/choreography
4. Доказательство доверия: 152-ФЗ, РФ-хостинг, очереди Celery (без фейковых логотипов)
5. CTA повтор + футер

Hero budget: бренд, headline, один саппорт, CTA-группа, один визуальный якорь. Без стат-полосок и «this week» в первом вьюпорте.

## Запреты

- Фиолетовый glow / indigo mesh / Inter-only / карточки-клоны
- Redirect `/` → `/login` без маркетинга (лендинг **заменяет** пустой редирект)
- Hover-only управление сценой на mobile
- Тяжёлый MP4 без poster и без reduced-motion fallback
- Параллельные overlapping edits Frontend+Motion на одних и тех же файлах без очереди в chain
- **Пустой gallery-hero** (density 3) когда brief = Dayos / «скинуть заказчику»
- Копировать только структуру секций без materials/presence = FAIL

## Источники (установлены в `.agents/skills/`)

| Skill | Откуда |
|-------|--------|
| `gsap-core` … `gsap-react` | greensock/gsap-skills |
| `gsap-choreography` | Costumary/gsap-choreography |
| `frontend-design` | anthropics/skills |
| `impeccable` | pbakaus/impeccable |
| `awwwards-landing` | Ga14ctic/awwwards-skill |
| `cinematic-scrub-landing`, `parallax-landing-page`, `video-to-landing-page`, `video-edit` | hoodini/ai-agents-skills |
| `remotion-best-practices` | remotion-dev/skills |
| `vignette` | pglevy/agent-skills |
| `scroll-scrub-video` | team (patterns + GSAP/ffmpeg) |

Локальные: `landing-client-ready`, `luxury-web-craft`, `web-motion-engine`, `asset-pipeline`, `ui-ux-pro-max`, `taste-skill`, `assembly-figures`, …

## Выход роли

`📣 **LANDING PROMO:** [signature] · client-ready gate · density 6–7 · paths · готов к Frontend/Motion`
