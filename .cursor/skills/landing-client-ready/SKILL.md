---
name: landing-client-ready
description: >-
  Hard gate for marketing landings that must be sendable to a paying client.
  Use before/during Landing Promo and Frontend work on public `/`, and when
  Client rejects «empty / no design» screenshots. Overrides airy gallery density
  for immersive B2B promo (Dayos-class presence). Not for /app cabinet UI.
---

# Landing Client-Ready — Presence Gate

Цель: страница, которую **не стыдно скинуть заказчику**. Не «технический каркас» и не «дорогая пустота галереи».

## Design Read (обязателен до кода)

Одна строка: *«Reading this as: B2B Doc SaaS promo for RF buyers, Dayos-class immersive presence, dials variance 7 / motion 7 / **density 6–7**.»*

Если референс URL/скрин дан — сначала `reference-landing-adapt`, потом этот gate.

## Жёсткий REJECT (Клиент обязан резать)

1. **Пустой hero** — >35% viewport «мёртвого» фона без типа / signature / атмосферы.
2. **Карманный блок по центру** — hero-контент выглядит как маленькая карточка в океане серого (нет edge-to-edge присутствия).
3. **Плоский однотон** без атмосферы (градиент/зерно/видео/сцена) на первом экране.
4. **Signature крошечный** — сцена фигурок/видео занимает <35% ширины desktop hero.
5. **Тип без веса** — headline не доминирует (визуально слабее nav).
6. **Нет материалов** — всё = border + padding + серый текст (нет бумаги/глины/металла/света).
7. **Кабинетный DESIGN на витрине** — токены `/app` без marketing-приложения.
8. **Слабый бренд-тест** — убрать nav → страница может быть любым SaaS.

## Обязательный Presence (desktop 1440)

| Зона | Минимум |
|------|---------|
| Hero | Full-bleed theme plane; headline `clamp` до ~5–7rem; signature ≥40% колонки; CTA в первом экране без скролла |
| Ритм секций | Смена плоскости (grey/black/white или dark/cream) каждые 1–2 экрана; rounded morph или чёткий edge |
| Тип | Display/hero face ≠ body; tracking/leading осознанные; без Inter-only |
| Motion | ≥2 намеренных момента (вход hero + 1 scroll); reduced-motion fallback |
| Доверие | 152‑ФЗ / интеграции / процесс — не фейковые логотипы ERP |

## Dials (маркетинг Doc SaaS + Dayos-class)

| Dial | Значение | Почему |
|------|----------|--------|
| VARIANCE | 7 | Богато, не хаос |
| MOTION | 7 | Кино уместно |
| **DENSITY** | **6–7** | Не gallery (3–4). Immersive presence |

`taste-skill` baseline density 4 **не применять** к этой витрине, пока brief не скажет «спокойный Linear».

## Порядок в волне

1. Обновить / соблюсти `frontend/DESIGN.md` § Marketing (+ tokens).
2. Wireframe ASCII hero (Архитектор) → наличие presence.
3. Landing Promo brief → Frontend → Motion → Asset Pipeline.
4. Клиент: этот чеклист + `web-visual-critic/checklist-visual.md` § Landing presence.
5. Без зелёных пунктов Presence → **НЕ ПРИНЯТО**, даже если «всё кликается».

## Связанные skills

- `landing-promo`, `reference-landing-adapt`, `luxury-web-craft`, `frontend-design`, `impeccable`, `awwwards-landing`
- `assembly-figures` (если signature = фигурки)
- `web-visual-critic` (приёмка)

## Выход

`📣 **CLIENT-READY GATE:** density 6–7 · presence ok|REJECT reasons · DESIGN.md §Marketing`
