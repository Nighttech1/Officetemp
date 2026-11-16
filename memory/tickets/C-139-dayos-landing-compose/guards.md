# Guards — C-139 Dayos landing compose

## Checks
- [x] `/` shows Dayos-like section rhythm: grey hero → black pillars → product → trio → cream use-cases → integrations → capabilities → contact
- [x] Brand/copy is DocSaaS (DOCX/PDF, Excel/Google/Яндекс, 152‑ФЗ) — not Dayos/Hero AMS
- [x] Desktop 1440 screenshot: `memory/waves/W-57-dayos-landing/after-hero-1440-final.png`
- [x] Pillars shot: `memory/waves/W-57-dayos-landing/after-pillars-1440.png`
- [x] anti_slop_scan on `frontend/components/landing`: OK

## How to re-check
1. Open http://127.0.0.1:3000/
2. Compare structure to Dayos reference (not pixel brand)
3. Confirm CTA → `/register` and `/login`
