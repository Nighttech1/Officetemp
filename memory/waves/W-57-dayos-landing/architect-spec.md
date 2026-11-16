# Architect Spec — W-57 Dayos → Doc SaaS landing

## Цель

Пересобрать публичный `/` в композиции [Dayos](https://www.dayos.com/?ref=lapaninja): секции, ритм, signature «собирающиеся фигурки» — **под Doc SaaS**, с возможностью менять фигуры через конфиг.

## Границы

- Только `frontend/components/landing/**`, `frontend/content/assembly-figures*`, токены landing в CSS, skills/registry команды.
- Backend / кабинет `/app` не трогать.
- Не пиратить ассеты Dayos (видео Storyblok, логотипы). Сцена — наша.

## Сигнатура hero

**Editable Assembly Figures** (не WebM как единственный вариант):
- Конфиг: `frontend/content/assembly-figures.json`
- Рендер: SVG/CSS 3D-примитивы (disc, cylinder, cone, ring, bar, capsule)
- Анимация: GSAP assemble (scatter → target)
- Правка: изменить JSON (type, color, x, y, z/rot, scale, delay) → новые фигурки
- Fallback: статичный assembled кадр при `prefers-reduced-motion`

## Секции (карта)

1. **Hero** (theme grey) — бренд DocSaaS, split headline, support, CTA, AssemblyScene
2. **Pillars** (black rounded) — 3 тезиса боли/решения (как AI / GAP / CLOSED)
3. **Intro product** — «Вводим Doc Engine» + CTA
4. **Trio** — Шаблон / Данные / Генерация (Answers/Actions/Experts)
5. **Use cases** — горизонтальный carousel 3 кейса
6. **Integrations strip** — Word, Excel, Google, Яндекс, PDF, 152‑ФЗ (не чужие Oracle/SAP)
7. **Capabilities** — 5 направлений продукта
8. **CTA + footer** (уже в layout)

## Токены landing (вдохновлены Dayos, бренд наш)

- grey canvas: `#e8e8e6`
- black: `#0a0a0a`
- white: `#f7f7f5`
- ink: `#111` / cream on dark
- accent CTA: существующий `--color-brand` teal
- display: текущие font-hero / font-display (не Suisse — лицензия)

## Риски

- Cookie banner на референсе мешает скринам — не копировать.
- Overlap Frontend+Motion на одних файлах — строго по chain (сначала структура FE, потом Motion/assembly).
- Mobile: без pin-jank; assembly упростить (меньше фигур / CSS only).

## DoD

- localhost `/` desktop 1440 + iPhone/Android без H-scroll
- Фигуры меняются правкой JSON без правки JSX сцены
- Guards C-139…C-141
- Клиент: сравнение с ref (композиция), не пиксель-бренд Dayos
