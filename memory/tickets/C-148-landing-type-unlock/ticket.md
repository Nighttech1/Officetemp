### [C-148] Разблокировать display-тип маркетинга (снять 18px !important с `/`)

- **Зона / Экран:** globals.css → публичный `/` (не кабинет `/app`)
- **Факт:** `h1, h2, h3, .text-2xl…text-9xl { font-size: 18px !important }` — Playwright: computed h1 = **18px**, хотя класс `text-[clamp(2.4rem,7.2vw,5.75rem)]`. Hero/секции выглядят как «мелкий абзац», не Dayos display.
- **Ожидание по DESIGN.md:** Marketing type — headline clamp ~5–7rem; UI floor 14–18px только для `/app` и форм, **не** для marketing display.
- **Приоритет:** P0
- **Скрин-улика:** `memory/waves/W-60-landing-handoff/before-hero-1440.png` + evaluate fontSize=18px
- **Зона:** Frontend
- **Acceptance:** на 1440 `getComputedStyle(h1).fontSize` ≥ 38px (2.4rem); секции h2 тоже крупнее 18px на маркетинге.
