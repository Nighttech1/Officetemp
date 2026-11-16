### [C-212] Накладные: паритет общего UX с ИУЛ (без remount + высота)
- **Зона:** `/app/documents/waybills`
- **Факт:** WaybillWizard всё ещё с FadeIn и step-motion на каждую смену docId; высота карточки не совпадает с ИУЛ-паттерном.
- **Ожидание:** Как C-207: useLayoutEffect, animateStep только по setStep, без внутреннего FadeIn; GlassCard min-height как у ИУЛ.
- **Приоритет:** P0
- **Зона:** Frontend
