---
name: DocSaaS Cabinet
description: Dark premium B2B SaaS cabinet for document templates, Excel mapping, and DOCX/PDF generation — teal/cyan accents, glass panels, soft motion.
colors:
  brand: "#22C55E"
  brand-hover: "#5EEAD4"
  brand-muted: "#134E4A"
  brand-ink: "#99F6E4"
  brand-glow: "#14B8A6"
  surface: "#09090B"
  surface-card: "#18181B"
  surface-glass: "rgba(24, 24, 27, 0.72)"
  surface-muted: "#27272A"
  ink: "#FAFAFA"
  ink-soft: "#D4D4D8"
  ink-muted: "#A1A1AA"
  line: "#3F3F46"
  danger: "#F87171"
  ok: "#4ADE80"
typography:
  sans:
    fontFamily: Source Sans 3
  display:
    fontFamily: Fraunces
rounded:
  base: 0.75rem
spacing:
  touch: 44px
motion:
  page: "fade + scale 0.98→1, 220ms ease-out"
  aurora: "CSS keyframes blobs, paused when prefers-reduced-motion"
---

# DocSaaS — DESIGN (Dark premium)

Рабочий кабинет (не маркетинговый лендинг). Тёмная zinc-поверхность, акцент **teal/cyan** (без purple), стеклянные панели и мягкий motion в духе 21st.dev Magic UI / Aceternity — **собственный код в репозитории**.

## Tokens (CSS)

```css
:root {
  --color-brand: #22c55e;
  --color-brand-hover: #5eead4;
  --color-brand-muted: #134e4a;
  --color-brand-ink: #99f6e4;
  --color-surface: #09090b;
  --color-surface-card: #18181b;
  --color-surface-muted: #27272a;
  --color-ink: #fafafa;
  --color-ink-soft: #d4d4d8;
  --color-ink-muted: #a1a1aa;
  --color-line: #3f3f46;
  --color-danger: #f87171;
  --color-ok: #4ade80;
  --radius: 0.75rem;
  --touch-min: 44px;
}
```

## Typography

- **Fraunces** — только логотип «DocSaaS».
- **Source Sans 3** — весь UI (формы, таблицы, кнопки).

## Layout

- Max content width ~1024px (`max-w-5xl`).
- Mobile &lt;640px: одна колонка, без горизонтального скролла страницы.
- Кнопки и интерактив ≥44px по высоте.
- Auth / contact: `AuroraBackground` + `GlassCard` по центру.
- Cabinet shell: тёмный sticky nav с glass blur.

## Motion

- Библиотека: только **`motion`** (`motion/react`).
- `FadeIn`: opacity 0→1, scale 0.98→1, 180–280ms ease-out.
- Aurora: CSS keyframes + transform; при `prefers-reduced-motion: reduce` — статично.
- Primary CTA: лёгкий shimmer / glow на hover (не layout thrashing).

## Forbidden

- Purple / indigo / violet gradients
- Cream + terracotta broadsheet
- Emoji decoration
- Light-mode-first chrome (этот релиз — dark)

## Components

- `AuroraBackground` — мягкие градиентные blobs.
- `GlassCard` — glassmorphism panel (`backdrop-blur`, полупрозрачный card).
- `FadeIn` — page/section entrance.
- `ShimmerButton` — primary CTA с бликом.
- Primary button: solid cyan-teal, dark ink text или белый — высокий контраст.
- Secondary: transparent + line border на тёмном.
- Errors sit next to the action that failed.
- Cards only for interactive/content grouping (forms, lists).

## A11y

- Skip-link → `#main`, focus-visible кольцо cyan на тёмном offset.
- Labels на всех полях; контраст ink на surface ≥ WCAG AA.

---

# Marketing (public `/`)

Публичная витрина DocSaaS (не кабинет). Канон: **Dayos-class immersive presence**, не gallery-air.

**Dials:** variance **7** / motion **7** / density **6–7**  
Gate: `.cursor/skills/landing-client-ready/SKILL.md`

## Marketing tokens

```css
--color-landing-dark: #0a0a0a;
--color-landing-cream: #f7f7f5;
--color-landing-grey: #e8e8e6;
--color-landing-ink: #111111;
--color-landing-muted: #8d8a83;
--color-brand: #22c55e; /* CTA / accents — ярко-зелёный */
```

Атмосфера героя: мягкий radial/grain поверх grey/cream — **не** голый flat fill на весь viewport.

## Marketing composition (presence)

- Hero **full-bleed**: текст + signature в одной плоскости; signature ≥40% ширины на 1440.
- Headline доминирует (`clamp` крупный); CTA в первом экране.
- Чередование grey → black → cream/white по секциям.
- Запрещён «островок контента в океане серого» (REJECT Клиента).

## Marketing type

- **Hero / display** — плотный grotesk (`font-hero`); clamp крупный; **не** давить глобальным UI floor 18px.
- UI floor `18px !important` только под `[data-ui-floor="app"]` (кабинет).
- **Body / nav** — читаемый sans; muted не серее #8d8a83 на cream.
- Fraunces — только точечный бренд/italic, не весь hero.

## Marketing motion

- GSAP + ScrollTrigger: hero assemble + section reveal + marquee.
- Lenis desktop; mobile native.
- `prefers-reduced-motion` → статичный assembled кадр.

## Marketing forbidden

- Purple / чужие логотипы Dayos/ERP / пиратский WebM как единственный signature без editable fallback.
- Карточки в hero; login-gate на `/`.
- Gallery density 3–4 «ради воздуха», когда нужен client-ready.
- Кабинетные glass-card паттерны на всей витрине.