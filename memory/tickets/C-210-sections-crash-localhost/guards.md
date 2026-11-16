# C-210 — Упавшие разделы кабинета (hooks + sync 422)

## Симптом
На localhost «падали» разделы: ИУЛ крашился (Rules of Hooks), накладные сыпали setState-in-render, workspace PUT 422.

## Причина
1. `InfoSheetWizard`: `useEffect` после `if (!iul) return`
2. `SlideTabs`: `onOrientationChange` внутри updater `setVertical`
3. Backend `systemKey` принимал только `signatures`, FE слал `iul`/`waybills`

## Фикс
- FE: hooks до early-return; orientation через `queueMicrotask`
- BE: `Literal["signatures","iul","waybills"]`
- Порт в текстах AuthGate/api: 8005
- API перезапущен на :8005

## Guard
- `/app/documents/info-sheet` — мастер + tabs без crash
- `/app/documents/waybills` — 5 шагов без setState crash
- PUT `/api/v1/workspace/snapshot` → 200 (с JWT)
- `/` — 8 секций visible, 0 console errors
