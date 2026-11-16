---
name: assembly-figures
description: >-
  Editable assembling geometric figures for landing heroes (Dayos-style).
  Use when the user wants morphing/assembling shapes in the hero and must be
  able to change figure set, colors, and positions via config — not only a
  baked WebM. Pairs with Motion (GSAP) and Landing Promo.
---

# Assembly Figures — editable hero scene

Dayos и похожие сайты показывают «фигурки, которые собираются». Часто это
готовое **видео**. Нам нужен вариант, где маркетинг может **менять набор**.

## Когда

- Референс с assembling / morphing / soft 3D shapes в hero
- Запрос: «чтобы можно было менять фигурки»
- Chain указывает `assembly-figures` или C-* про editable figures

## Когда нет

- Обычный UI motion без сцены
- Тяжёлый Three.js без явного WebGL в chain (сначала этот скилл / SVG)

## Контракт данных

Файл: `frontend/content/assembly-figures.json`

```json
{
  "version": 1,
  "canvas": { "width": 720, "height": 720, "bg": "transparent" },
  "figures": [
    {
      "id": "disc-a",
      "type": "disc",
      "color": "#d4cfc4",
      "x": 360, "y": 320, "rot": -12, "scale": 1,
      "scatter": { "x": -80, "y": 120, "rot": 40 },
      "delay": 0.05
    }
  ]
}
```

Типы: `disc` | `cylinder` | `cone` | `ring` | `bar` | `capsule`.

## Реализация

1. Компонент `AssemblyScene` читает JSON (import или fetch).
2. GSAP: из `scatter` → целевые `x,y,rot,scale`; stagger по `delay`.
3. `prefers-reduced-motion` → сразу assembled, без tween.
4. Mobile: можно `figures.slice(0, N)` или `data-lite="true"`.
5. Не хардкодить чужие ассеты Storyblok/Dayos.

## Как менять фигурки (для команды)

1. Открыть `assembly-figures.json`
2. Добавить/убрать объект в `figures` или сменить `type` / `color` / координаты
3. Сохранить → обновить localhost — сцена подхватит конфиг
4. Не нужно трогать JSX сцены, пока не нужен новый `type`

## Выход

`🧩 **ASSEMBLY FIGURES:** [N figures · config path · reduced-motion ok]`
