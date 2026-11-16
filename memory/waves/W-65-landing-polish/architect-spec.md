# W-65 — Services carousel / FAQ hover / Login type

## Тикеты (≤3)

| ID | Приоритет | Суть |
|----|-----------|------|
| C-176 | P1 | «Услуги»: rename; при hover только гориз. скролл (без вертикали); плавный (не дискретный); равный gap без разрыва цикла; то же для IntegrationsStrip |
| C-177 | P1 | FAQ: open/close только hover |
| C-178 | P2 | LoginPopover: подписи Логин/Пароль жирным чёрным |

## Chain

1. Landing / Frontend — UseCases, IntegrationsStrip, FaqSection, LoginPopover (+ CSS/Lenis prevent)
2. Тестировщик — Playwright probe
3. Деплоер — localhost
4. Клиент — приёмка

## Spec C-176

- Заголовок «Услуги»; id можно оставить `#use-cases` (якоря) или `#services` + обновить nav.
- На `wheel` над лентой: `preventDefault` всегда (и deltaY, и deltaX) → только горизонталь.
- `data-lenis-prevent` на wrap, чтобы Lenis не крутил страницу.
- Velocity + lerp в rAF (не raw delta за кадр).
- Track: без бокового `px-*` на треке (разрыв шва цикла); `gap-4` равномерно; loop ≥2 копий.
- IntegrationsStrip: убрать `px-4` с track; равный `gap-8`; GSAP xPercent -50 без шва.

## Spec C-177

- `onMouseEnter` / `onMouseLeave` на `<li>`; без click-toggle; default closed (`null`).
- Сохранить плавный grid 550ms.

## Spec C-178

- Labels: `font-bold text-landing-dark` (light panel) / bold cream на dark.
- Input text: `font-semibold text-black` на light (override field-control).
