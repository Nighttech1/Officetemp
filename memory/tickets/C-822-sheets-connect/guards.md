# Guards C-822

## Closed only with
1. Connect via `/api/v1/data/from-url` returns 200, `via=export_csv_gviz` (not gid=OOXML sheetId).
2. UI button «Подключить» succeeds without «HTTP 400 gid=…».
3. All tab names listed; CSV by name works (empty sheet OK).

## W-84 evidence
- Before: `debug-6cfa5a.log` gid=4 HTTP 400 from xlsx sheetId
- After: `e2e_http_from_url.json` status 200, 13 sheets, 14 cols, ~15s
- Write marker `W84-TEST-*` into «Мастерская №1» re-read via `_download_google_csv` has_marker=True
