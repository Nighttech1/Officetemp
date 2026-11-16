---
name: reference-landing-adapt
description: >-
  Adapt a liked landing page into our Doc SaaS promo. Use when the user pastes
  a reference URL, drops a screenshot/image of a landing, or says «скопируй
  этот лендинг», «сделай как у …», «адаптируй референс». Captures via
  design-clone / source-first-clone / Playwright MCPs, then rebuilds under our
  brand, copy, and Next.js stack — not a verbatim pirate copy.
---

# Reference Landing → Adapt under us

Пользователь «закидывает» понравившийся лендинг (ссылка или картинка). Команда **снимает** структуру/вайб и **пересобирает** витрину Doc SaaS, а не выкладывает чужой бренд как есть.

## Входы

| Что кинул пользователь | Что делать |
|------------------------|------------|
| **URL** публичной страницы | MCP `design-clone` → `clone_website_design` **и/или** MCP `source-first-clone` (`inspect_url` → `audit_reference_url` → `capture_reference_bundle` / `clone_reference_url`) |
| **Скрин / картинка** | Playwright / chrome-devtools скрин уже есть; `image-to-luxury-ui` + `create-design-md`; сверка `image-compare` |
| **Figma** (если дал файл) | Figma MCP → токены/фреймы, затем тот же adapt |

Артефакты складывать в `memory/waves/<wave>/reference/` (скрин, JSON clone, notes). Не коммитить чужие ассеты оптом.

## Жёсткие границы (право / этика)

- Копируем **композицию, ритм, motion-идеи, палитру как inspiration** — не логотипы, тексты, фото и уникальные иллюстрации чужого бренда.
- Не обходим логин, paywall, captcha.
- Итог — **наш** продукт: DOCX/PDF генерация, таблицы Excel/Google/Яндекс, 152-ФЗ, CTA на `/register` или `/contact`.
- Стек: Next.js + GSAP/Lenis + `frontend/DESIGN.md` (можно обновить токены из референса, но бренд наш).

## Pipeline

1. **Capture**  
   - URL: `design-clone` (цвета/шрифты/секции) + Playwright full-page screenshot (1440 + mobile).  
   - При сложной странице: `source-first-clone` capture/scaffold.  
   - Картинка: vision разбор + `create-design-md`.
2. **Brief adapt** — 5–8 буллетов: что берём (hero rhythm, bento, sticky chapter…), что выкидываем, чем заменяем контент Doc SaaS.
3. **DESIGN.md** — обновить токены только если Архитектор/Frontend согласны; иначе map референс → существующие токены.
4. **Build** — `landing-promo` + `luxury-web-craft` + Motion skills; paths из `chain.md`.
5. **Verify** — Playwright скрин нашего `/` vs reference; `image-compare` (похожесть композиции, не пиксель-в-пиксель чужой бренд); Клиент.

## Chain

```
Архитектор (reference URL/image + adapt brief)
  → Landing Promo / Frontend (capture MCP + DESIGN)
  → Motion
  → Asset Pipeline
  → Тестировщик (image-compare)
  → Фиксер → Деплоер → Клиент
```

## MCP map

| MCP | Tool / роль |
|-----|-------------|
| `design-clone` | `clone_website_design` — быстрый снимок HTML/CSS/colors/fonts |
| `source-first-clone` | inspect / capture / scaffold / verify — глубокий clone |
| `playwright` ×3 | скрины desktop/iPhone/Android |
| `image-compare` | референс vs наш localhost |
| `chrome-devtools` | DOM/стили точечно |

Skills: `exact-clone-airfare`, `web-clone` (если нужен Vite-scaffold вне Next — только как черновик capture, финал в `frontend/`), `landing-promo`, `image-to-luxury-ui`.

## Фраза пользователя

«Вот референс: https://… — сделай наш лендинг в этом духе»  
«Кидаю скрин — адаптируйте под наш сервис»

`📎 **REFERENCE ADAPT:** [url|image] · MCP used · keep/drop · DESIGN.md · next role`
