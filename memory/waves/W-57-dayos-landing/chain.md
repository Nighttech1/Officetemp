# Chain — W-57 Dayos landing

```
Архитектор (done: architect-spec.md)
  → Team gap-fill: assembly-figures skill + webgl.mdc + registry
  → Landing Promo / Frontend (C-139): секции, токены, контент Doc SaaS
  → Motion + assembly-figures (C-140, C-141): AssemblyScene + GSAP
  → Тестировщик (guards + anti-slop + Playwright скрины)
  → Фиксер
  → Деплоер localhost
  → Клиент
```

## Paths (no overlap)

| Роль | Paths |
|------|--------|
| Gap-fill / Docs | `.cursor/skills/assembly-figures/**`, `.cursor/rules/webgl.mdc`, `.cursor/registry/agents.md` |
| Landing / Frontend | `frontend/components/landing/**`, `frontend/content/assembly-figures.json`, `frontend/app/globals.css` (landing tokens only), `frontend/DESIGN.md` (landing appendix) |
| Motion | `frontend/components/landing/LandingMotion.tsx`, `frontend/components/landing/AssemblyScene.tsx`, `frontend/components/landing/assembly/**` |
| Tester | `memory/tickets/C-139*/guards.md`, `C-140*`, `C-141*`, `memory/waves/W-57*/` |

## Запреты

- Не звать Backend / Payment / Security
- Не параллелить Frontend и Motion на одном файле
- WebGL/Three — **не** обязателен в этой волне (assembly = SVG/CSS+GSAP). Роль WebGL регистрируем на будущее 3D-сцен.
