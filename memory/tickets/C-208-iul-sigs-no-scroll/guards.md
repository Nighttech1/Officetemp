# Guards C-208

1. Шаг «Подписи»: `TabsContent` без `absolute inset-0`, без `overflow-y-auto`, без `forceMount` stack.
2. У активного tabpanel `overflow-y: visible`, `scrollHeight ≈ clientHeight` (нет внутреннего скролла полей).

Проверено W-76: overflowY=visible, hasScrollbar=false.
