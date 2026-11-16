# Guards C-821

## Closed only with
1. Real template `templates/Накладная1 от 09.09.26.docx` (not synthetic 1×1 PNG).
2. Playwright: `header img` with `naturalWidth >= 100` AND `offsetWidth >= 50`.
3. After-screen `memory/waves/W-84-header-pan-gid/visual/preview-header.png` shows МОСПРОЕКТ / гербы.

## W-84 evidence
- `client_e2e_w84.json` → C-821-real-header-image ok (2480×573 → display 854×197)
- Root cause: docx-preview `wp:anchor` wrapper `width:0;height:0` + `max-width:100%`
- Fix: `fixFloatingHeaderImages` in `WaybillLivePreview.tsx`
