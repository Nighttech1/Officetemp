# Guards C-212

1. `WaybillWizard` без внутреннего `FadeIn`.
2. `useLayoutEffect` на смене `docId` + `animateStep` только в `setStep`.
3. Page layout: fixed `sm:h-[calc(100dvh-8rem)]`, `data-slide-tabs-fit`, `scrollbar-brand` на дереве.
4. Низ карточки = низ сайдбара (delta=0).

Проверено W-77.
