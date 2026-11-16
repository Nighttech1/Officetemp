# W-77 Architect Spec

## Root cause
Page `sm:h-[calc(100dvh-8rem)]` + `overflow-hidden` + GlassCard/`DocsStepMotion` `overflow-hidden` → контент выше слота **клипится**, скролла нет.

## Fix
1. Pages info-sheet + waybills: убрать жёсткий `sm:h-… overflow-hidden`; оставить `min-h-[calc(100dvh-8rem)]`, колонка `min-h-0 flex-1`, внутренний мастер `overflow-visible` / форма `overflow-y-auto` только если контент выше viewport (scrollbar появляется лишь при реальной нехватке места).
2. GlassCard мастера: `overflow-hidden` → `overflow-y-auto` (или `min-h-0 flex-1 overflow-y-auto`).
3. DocsStepMotion: для всех шагов кроме реестра — `overflow-y-auto` вместо `overflow-hidden` (не клипить). Реестр (step 5) — как было, явный scroll.
4. Preview: stretch без принуждения клипа соседа; `max-h-[min(100%,calc(100dvh-12rem))]` чтобы не раздувать lock.
5. Playwright guard: на `/app/documents/info-sheet` и waybills step 1–2 — последний видимый control в форме `getBoundingClientRect().bottom` ≤ card `bottom` (или card scrollHeight reachable); screenshot after.

## Acceptance
Клиент Playwright: поля «Наименование…» / низ шага не обрезаны; скрин after.
