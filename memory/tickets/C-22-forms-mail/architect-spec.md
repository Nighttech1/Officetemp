# Architect Spec — W-07 Final polish + roadmap close

## Scope ≤3
C-21 dark motion UI · C-22 forms/email · C-23 assets + release pack

**Out:** Live VPS/prod push (5.5 gate: explicit user «да»), Payment, Security cycle

## C-21 Design (override prior light-only DESIGN.md)
- Dark zinc/slate base `#09090b` / cards `#18181b` glass `backdrop-blur`
- Accent: teal/cyan glow `#2DD4BF` (not purple)
- Motion: `motion` (framer-motion) only — page fade+soft scale 0.98→1, 180–280ms ease-out; aurora blobs CSS animation; button hover glow
- Patterns inspired by 21st.dev libraries (Magic UI / Aceternity / Motion Primitives) — **copy patterns into repo**, no 21st runtime
- Update DESIGN.md

## C-22 Forms
- Model `ContactSubmission` or JSONL under `.runtime/forms/`
- Endpoints + honeypot field `website` must be empty
- SMTP optional via env `SMTP_HOST` etc.
- Frontend `/contact` dark UI

## C-23 Assets + Release
- sharp pipeline for sample hero/logo if any; placeholder blurhash string in component
- RELEASE.md: how to run compose release, env checklist, **no auto VPS**
- Mark roadmap 4.5, 5.8 done; 5.5 as «пакет готов / VPS ждёт согласования»

## Chain
Архитектор → Frontend+Motion (C-21) → Forms-mail+Backend (C-22) → Asset Pipeline+Deployer docs (C-23) → Tester → Fixer → Deployer localhost → Client
