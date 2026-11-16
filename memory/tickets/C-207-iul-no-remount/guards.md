# Guards C-207

1. `InfoSheetWizard` не использует внутренний `FadeIn`.
2. Смена `docId` → `useLayoutEffect` + `animateStep=false`.
3. `DocsStepMotion animate={animateStep}` — анимация только после `setStep` пользователем.
4. При клике другого ИУЛ opacity оболочки `[data-slide-tabs-fit]` не падает (нет fade 0→1).

Код: W-76.
