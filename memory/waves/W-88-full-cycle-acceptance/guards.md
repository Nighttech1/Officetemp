# Guards W-88

1. После `applySnapshotToLocal` — событие `docsaas:workspace-changed`; страница накладных делает rebind docId.
2. WaybillWizard `persist`: если `updateDocument` вернул null — ошибка «документ устарел», не silent fail.
3. Preview: `overflow: hidden` на viewport; fill только при `rowRangeConfirmed`.
4. `normalizeWaybillStep(4) === 4` (Реестр).
5. Localhost FE для приёмки: **:3001** если :3000 занят Grafana.
