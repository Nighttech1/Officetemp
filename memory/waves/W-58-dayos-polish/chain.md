# W-58 — Dayos polish to «согласовано»

**Тикеты:** C-142, C-143, C-144  
**Цель:** закрыть замечания Клиента W-57 до слова «согласовано».

## Chain

```
Архитектор
  → Frontend (C-143 mega-menu, C-144 icons/carousel structure)
  → Motion / assembly (C-142 clay 3D)
  → Тестировщик → Фиксер → Деплоер localhost → Клиент
```

## Paths

| Роль | Paths |
|------|--------|
| Frontend | `LandingNav.tsx`, `MegaNav.tsx` (new), `IntegrationsStrip.tsx`, `UseCases.tsx`, globals CSS nav |
| Motion | `AssemblyScene.tsx`, `assembly/*`, `assembly-figures.json` (tones only if needed) |
