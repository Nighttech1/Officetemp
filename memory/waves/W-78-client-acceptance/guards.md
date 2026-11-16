# Guards W-78 (C-213…C-219)

| ID | Guard | Evidence |
|----|-------|----------|
| C-213 | ИУЛ preview: нет p-подсказок «Загрузите PDF…»; накладные: нет stepHint / «появится шаблон» | Playwright evaluate + screens `iul-preview.png`, `waybill-preview-clean.png` |
| C-214 | Клик tablist шаг 2 меняет h2; DocsStepMotion scopeKey | `before≠after` в suite |
| C-215 | Resume после /app: idleSpin + RESUME_GRACE; screens без wild blur | `rubik-resume-t0/t400.png` |
| C-216 | disabled DOCX/PDF: bg ~ zinc-950, text zinc-500 | computed `rgb(9,9,11)` |
| C-217 | later tabs `text-ink-muted/70`; Next disabled `brand-muted` #14532d | suite |
| C-218 | `.scrollbar-brand` + max-h; overflow when many rows | scrollHeight 1215 > 420 |
| C-219 | «Настройки реестра» dialog; active `border-brand ring-brand` | `waybill-profile-active.png` |

Regression: не возвращать `canContinueStep2` без объявления; Button generate — `variant=secondary` + `!bg-zinc-950` when locked.
