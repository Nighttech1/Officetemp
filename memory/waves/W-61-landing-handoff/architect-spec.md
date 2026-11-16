# Architect-spec — W-61 (C-151 / C-157 / C-154)

**Reading as:** B2B Doc SaaS promo, Dayos-class, density 6–7.

## C-151 — Bento materials on dark sections

**Problem:** Pillars = bare text on flat black; ProductTrio cards thin.  
**Approach:**
- Pillars → 3 bento tiles: `rounded-3xl border border-white/12 bg-white/[0.04]` + soft inner highlight + kicker brand; optional asymmetric span on first tile (md:col-span feel without breaking 3-col).
- ProductTrio → denser bento: number index, stronger border, hover border-brand/40; keep copy.
- Inspired by 21st bento **9594** — structure/materials only, DocSaaS copy.

## C-157 — FAQ before ContactCTA

**Problem:** No trust answers for customer handoff.  
**Approach:** New `FaqSection.tsx` before `ContactCTA` on cream plane (breaks 3× black rhythm partially — cream FAQ).  
Accordion pattern like 21st **29935**: each Q in bordered rounded panel; native `<details>` or Radix (already in project). Prefer accessible `<details>`/`<summary>` for zero new deps if no shadcn Accordion.  
Honest FAQs: Word template, 152-ФЗ, pricing demo, Excel/Google/Yandex, ZIP/Celery.

## C-154 — Mobile hero density

**Problem:** Large grey void after CTAs; figures clipped.  
**Approach:**
- Mobile: drop `min-h-[100dvh]` force; use `min-h-0` + tighter `pt/pb/gap`.
- Put signature closer: reduce `min-h-[42vw]`; scale AssemblyScene `max-w-[85%]` on mobile; negative margin pull-up.
- Order unchanged (copy → CTA → figures) but compress vertical rhythm so figures enter first viewport more.

## Boundaries

- Only `frontend/components/landing/*` + LandingPage import.
- No Backend. No VPS.
- Do not re-touch C-148 font floor.

## Paths

- `Pillars.tsx`, `ProductTrio.tsx` — C-151
- `FaqSection.tsx` (new) + `LandingPage.tsx` — C-157
- `Hero.tsx` (+ maybe AssemblyScene class) — C-154
- `LandingMotion.tsx` — ensure `.landing-section .landing-reveal` covers FAQ
