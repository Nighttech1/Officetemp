# Guards C-211 — preview fit height

## Regression
1. Открыть `/app/documents/info-sheet` (desktop 1440).
2. Панель предпросмотра справа: `overflowY` visible, `maxHeight: none`, `scrollHeight <= clientHeight + 2`.
3. Нет вертикального scrollbar у `.iul-sheet-preview` и `[data-preview-shell=iul]`.
4. Ключ localStorage высоты: `docsaas_preview_fit_h_*` (старые `docsaas_preview_h_*` не читать).

## Probe
`memory/waves/W-78-preview-chrome-registry/probe_w78.py` → check `preview-no-forced-yscroll`.

## Status
PASS 2026-10-02 (W78_PASS)
