# Architect spec — C-24 True dark glass

## Проблема
`GlassCard` с `backdrop-blur-xl` + яркий центр aurora даёт молочный «светлый» panel. Inputs `surface-muted/80` на скрине тоже читаются светлыми.

## Решение
1. `GlassCard`: `bg-[rgba(9,9,11,0.82)]` (или `bg-surface/80`), `backdrop-blur-md` (меньше milk), border `border-white/10` + `shadow-glow` teal rim.
2. `Field` / textarea contact: `bg-zinc-900/90`, `border-zinc-700`, placeholder muted.
3. Не менять API/роуты.

## Acceptance
Скрин login/register/contact 1440: карточка и инпуты визуально тёмные (не серо-белые).
