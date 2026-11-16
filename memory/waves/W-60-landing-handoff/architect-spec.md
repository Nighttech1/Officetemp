# Architect-spec — W-60 Landing handoff (C-148 / C-149 / C-145)

**Reading as:** B2B Doc SaaS promo for RF buyers, Dayos-class immersive presence, dials variance 7 / motion 7 / **density 6–7**.

## Problem

1. **C-148:** Global UI floor `h1… { font-size: 18px !important }` in `frontend/app/globals.css` crushes marketing display type. Hero clamp never wins.
2. **C-149:** Hero is flat `#e8e8e6` — no grain/radial/soft blobs (client-ready REJECT).
3. **C-145:** Composition sparse; AssemblyScene ~34% width; brand only tiny eyebrow; mobile empty sheet.

## ASCII hero (target)

```
┌──────────────────────────────────────────────────────────────┐
│ DocSaaS nav …                                    [Кабинет] │
├──────────────────────────────────────────────────────────────┤
│  ░░ grain / soft teal-cream blobs (full-bleed) ░░░░░░░░░░░  │
│                                                              │
│  DocSaaS                          ┌─────────────────────┐   │
│  ДОКУМЕНТЫ                        │   ASSEMBLY LARGE    │   │
│  ИЗ ШАБЛОНА.                      │   ≥40% width        │   │
│  БЕЗ СРЫВА                        │   clay + teal punch │   │
│  ВЁРСТКИ.                         └─────────────────────┘   │
│  subcopy…                                                    │
│  [Начать ✨] [Войти]                                         │
└──────────────────────────────────────────────────────────────┘
```

## Boundaries

- Only `frontend/` marketing surface + globals scoping.
- Do **not** remove UI 14–18px floor inside `/app` (ИУЛ/кабинет).
- No Backend. No Security cycle.
- 21st: adapt Floating Gradient **19381** spirit (soft blobs) — no purple AI slop; brand teal/cream/grey.

## Approach

### C-148
- Scope the 18px !important lock to app shell: e.g. `html[data-ui-floor="app"] h1…` OR exclude `.landing-hero, [data-landing], .font-hero` and marketing sections.
- Preferred: wrap app layout with `data-ui-floor="app"`; marketing `/` stays free. Fallback: `:not([data-landing])` exclusions for display classes.

### C-149
- Add `HeroAtmosphere` absolute layer: CSS radial gradients + SVG/CSS grain noise; optional subtle animated blobs (CSS or light GSAP) inspired by 21st 19381.
- `prefers-reduced-motion`: static.

### C-145
- Widen grid / reduce max-w constraint or enlarge AssemblyScene `max-w` to hit ≥40% viewport.
- Stronger brand line (wordmark weight); denser vertical rhythm; mobile: pull signature up, cut empty gap.

## Risks

- App typography regression if floor removal is global → must scope.
- Grain SVG size → keep CSS `filter`/`background-image` noise, no heavy assets.

## Out of wave

C-150…C-161 backlog (bento, FAQ, shimmer CTA, favicon, etc.).
